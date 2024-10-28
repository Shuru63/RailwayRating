import logging
import os
import calendar
import datetime
from user_agents import parse
from django.http import HttpResponse
from django.shortcuts import render
import platform
import threading
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django_ratelimit.decorators import ratelimit
from dateutil.relativedelta import relativedelta
from django.conf import settings

from task.models import Task
from ratings.models import Rating
from task_shift_occurrence.models import TaskShiftOccurrence
from feedback.views import FeedbackAPI
from feedback.models import FeedbackSummaryVerification
from website.decorators import allowed_users
from website.utils import (
    update_rating_status, 
    valid_task_date 
    )
from .utils import (
    compress_pdf, 
    html_to_pdf, 
    calculate_penalty, 
    calculate_daily_feedback,
    calculate_monthly_data,
    DailyData
    )
from .threads import MailPDF
from .models import DailyEvaluationVerification
from cms.settings import REQ_URL
from notified_data.models import notified_data
from station.models import Station


run_thread_event = threading.Event()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
def daily_buyers_rating_sheet_pdf(request):
    '''
    This view fill generate a pdf with the buyers rating sheet
    method: GET
    query params: date, pdf_method, download
    required query params: date
    returns: pdf file
    rtypes: application/pdf
    '''
    try:
        if run_thread_event.is_set():
            return Response({"message": "A pdf is already being sent try after sometime"}, status=status.HTTP_200_OK)
        pdf_method = request.GET.get('pdf_method')

        def _daily_buyers_rating_sheet_pdf():
            try:
                station = request.user.station
                date1 = request.GET.get('date')
                if not date1:
                    return Response({"message": "Date is missing"}, status=status.HTTP_400_BAD_REQUEST)
                
                date = datetime.datetime.strptime(date1, '%Y-%m-%d').date()
                formatted_date = date.strftime('%d-%m-%Y')
                if station.station_category in ['A', 'A1']:
                    context = DailyData().primary_stations(request, date, True)
                elif station.station_category in ['B', 'D', 'E']:
                    context = DailyData().bde_stations(request, station, date, False)
                else:
                    return Response({"message": "Station category not found"}, status=status.HTTP_400_BAD_REQUEST)
                if not context:
                    return Response(
                        {"message": "An error occurred while pdf processing"}, 
                        status=status.HTTP_400_BAD_REQUEST
                        )
            
                filename = f'buyers_rating_{formatted_date}_{station.station_name}.pdf'
                if station.station_category in ['A', 'A1']:
                    file_path = html_to_pdf('front/pdf/daily_buyers_rating_sheet.html', context, filename)
                elif station.station_category in ['B', 'D', 'E']:
                    file_path = html_to_pdf('front/pdf/bde_daily_buyers_rating.html', context, filename)
                else:
                    return Response({"message": "Station category not found"}, status=status.HTTP_400_BAD_REQUEST)

                if not file_path:
                    return Response({"message": "Empty PDF"}, status=status.HTTP_204_NO_CONTENT)

                with open(file_path, 'rb') as f:
                    response = HttpResponse(f.read(), content_type='application/pdf')
                content = f"inline; filename={filename}"
                download = request.GET.get("download")
                if download:
                    content = f"attachment; filename={filename}"
                response["Content-Disposition"] = content

                if pdf_method == 'MAIL':
                    compressed_file_path = os.path.join(settings.MEDIA_ROOT, 'pdf_files', f'compressed_{filename}')
                    input_size, output_size = compress_pdf(file_path, compressed_file_path)
                    logging.info(f"the pdf sizes are before {input_size} to {output_size}")
                    file_name = f'raw_buyers_rating_{formatted_date}_{station.station_name}.pdf'
                    subject = "Daily Buyer's Rating"
                    message = f"Daily Buyer's Rating for the date: {formatted_date} is: "
                    message += 'for ' + station.station_name 
                    subject += 'for ' + station.station_name + ' of ' + formatted_date
                    mp = MailPDF(file_name, file_path, compressed_file_path, subject, message, request, run_thread_event)
                    if run_thread_event.is_set():
                        return Response({"message": "A pdf is already being sent try after sometime"}, status=status.HTTP_200_OK)
                    else:
                        mp.start()
                        run_thread_event.set()
                        return Response({"message": "Your data is being sent to your Email. Please check your mail."}, status=status.HTTP_200_OK)

                os.remove(file_path)
                return response
            
            except Exception as e:
                logging.exception(f"An error occurred in thread  _daily_buyers_rating_sheet_pdf: {repr(e)}")
                return Response({"message": "An error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        if pdf_method == 'MAIL':
            thread = threading.Thread(target=_daily_buyers_rating_sheet_pdf)
            thread.start()
            logging.info("Thread started: _monthly_pdf")
            run_thread_event.set()
            return Response({"message": "Your data is being processed. Please check your mail later."}, status=status.HTTP_200_OK)
        else:
            return _daily_buyers_rating_sheet_pdf()
            
    except Exception as e:
        logging.exception(f"An error occurred in daily_buyers_rating_sheet_pdf: {repr(e)}")
        run_thread_event.clear()
        logging.info("Thread cleared: _daily_buyers_rating_sheet_pdf")
        return Response({"message": "An error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
def daily_pdf(request):
    '''
    This view is used to generate PDF for Daily Summary and Daily Report.
    method: GET
    permission: IsAuthenticated
    returns: PDF file
    query params: date, pdf_method, pdf_for, unique_variable, download
    required query params: date, pdf_for
    rtype: application/pdf
    '''
    try:
        if run_thread_event.is_set():
            return Response({"message": "A pdf is already being sent try after sometime"}, status=status.HTTP_200_OK)
        pdf_method = request.GET.get('pdf_method')

        def _daily_pdf():
            try:
                station = request.user.station
                date1 = request.GET['date']
                pdf_for = request.GET.get('pdf_for')
                review_with_images = 'unique_variable' in request.GET and request.GET['unique_variable'] == 'review'
                download_with_images = 'unique_variable' in request.GET and request.GET['unique_variable'] == 'download'
                is_images = False
                if review_with_images or download_with_images:
                    is_images = True
                if not date1:
                    return Response({"message": "Date is missing"}, status=status.HTTP_400_BAD_REQUEST)
                if not pdf_for:
                    return Response({"message": "pdf_for is missing"}, status=status.HTTP_400_BAD_REQUEST)
                
                update_rating_status(request.user.username, station, date1)
                date = datetime.datetime.strptime(date1, '%Y-%m-%d').date()
                saved_pdf_date = date.strftime('%d-%m-%Y')
                year = str(date.year)
                month = str(date.month)
                month_name = calendar.month_name[int(month)].capitalize()
                num_days = calendar.monthrange(int(year), int(month))

                if station.station_category in ['A', 'A1']:
                    daily_buyers_rating_context = DailyData().primary_stations(request, date, False)
                elif station.station_category in ['B', 'D', 'E']:
                    daily_buyers_rating_context = DailyData().bde_stations(request, station, date, is_images)
                else:
                    return Response({"message": "Station category not found"}, status=status.HTTP_400_BAD_REQUEST)
                if not daily_buyers_rating_context:
                    return Response(
                        {"message": "An error occurred while pdf processing"}, 
                        status=status.HTTP_400_BAD_REQUEST
                        )
                
                sup_summary_ver = False
                feedback_summary_objects = FeedbackSummaryVerification.objects.filter(
                    station=station, 
                    verified_summary_date=date1)
                sup_summary_ver_obj = feedback_summary_objects.filter(
                    verified_by__user_type__name="supervisor").last()
                if sup_summary_ver_obj:
                    if sup_summary_ver_obj.verification_status:
                        sup_summary_ver = sup_summary_ver_obj
                
                con_summary_ver = False
                con_summary_ver_obj = feedback_summary_objects.filter(
                    verified_by__user_type__name="contractor").last()
                if con_summary_ver_obj:
                    if con_summary_ver_obj.verification_status:
                        con_summary_ver = con_summary_ver_obj

                sup_evaluation_ver = False
                daily_evaluation_objects = DailyEvaluationVerification.objects.filter(
                    station=station, 
                    verified_eval_date=date1)
                sup_evaluation_ver_obj = daily_evaluation_objects.filter(
                    verified_by__user_type__name="supervisor").last()
                if sup_evaluation_ver_obj:
                    if sup_evaluation_ver_obj.verification_status:
                        sup_evaluation_ver = sup_evaluation_ver_obj
                
                con_evaluation_ver = False
                con_evaluation_ver_obj = daily_evaluation_objects.filter(
                    verified_by__user_type__name="contractor").last()
                if con_evaluation_ver_obj:
                    if con_evaluation_ver_obj.verification_status:
                        con_evaluation_ver = con_evaluation_ver_obj

                context = {
                    'saved_pdf_date':saved_pdf_date, 'station': station, 'year': year, 'month': month, 'month_name': month_name, 'num_days': num_days[1],
                    # Feedback varification
                    'feedback_date': date1, 'sup_summary_ver': sup_summary_ver, 'con_summary_ver': con_summary_ver,
                    "sup_evaluation_ver":sup_evaluation_ver,"con_evaluation_ver":con_evaluation_ver,
                }
                context.update(daily_buyers_rating_context)
                linux_environment = platform.system() == 'Linux'
                context['linux_environment'] = linux_environment
                
                if review_with_images:
                    context['showimages'] = True
                
                if download_with_images:
                    context['showimages'] = True

                context['is_prod'] = os.getenv('ENV') == 'PROD'
                if pdf_for == 'daily_report':
                    filename = f"daily_report_{saved_pdf_date}_{station.station_name}.pdf"
                    if station.station_category in ['A', 'A1']:
                        file_path = html_to_pdf('front/pdf/pdf_daily.html', context, filename)
                    elif station.station_category in ['B', 'D', 'E']:
                        context['daily_report_for_bde'] = True
                        file_path = html_to_pdf('front/pdf/bde_daily.html', context, filename)
                    else:
                        return Response({"message": "Station category not found"}, status=status.HTTP_400_BAD_REQUEST)
                    email_subject = f'Daily Rating Report - {saved_pdf_date} - {station.station_name}'
                    email_message = f'Daily Rating Report for the date: {saved_pdf_date} is: '

                elif pdf_for == 'daily_summary':
                    filename = f"daily_summary_{saved_pdf_date}_{station.station_name}.pdf"
                    if station.station_category in ['A', 'A1']:
                        file_path = html_to_pdf('front/pdf/pdf_daily_minimal.html', context, filename)
                    elif station.station_category in ['B', 'D', 'E']:
                        file_path = html_to_pdf('front/pdf/bde_daily.html', context, filename)
                    else:
                        return Response({"message": "Station category not found"}, status=status.HTTP_400_BAD_REQUEST)
                    email_subject = f'Daily Rating Summary - {saved_pdf_date} - {station.station_name}'
                    email_message = f'Daily Rating Summary for the date: {saved_pdf_date} is: '

                elif pdf_for == 'daily_summary_images':
                    filename = f"daily_summary_{saved_pdf_date}_{station.station_name}.pdf"
                    if station.station_category in ['A', 'A1']:
                        file_path = html_to_pdf('front/pdf/pdf_daily_minimal.html', context, filename)
                    elif station.station_category in ['B', 'D', 'E']:
                        file_path = html_to_pdf('front/pdf/bde_daily.html', context, filename)
                    else:
                        return Response({"message": "Station category not found"}, status=status.HTTP_400_BAD_REQUEST)
                    email_subject = f'Daily Rating Summary - {saved_pdf_date} - {station.station_name}'
                    email_message = f'Daily Rating Summary for the date: {saved_pdf_date} is: '
                else:
                    return Response({"message": "Invalid PDF request"}, status=status.HTTP_400_BAD_REQUEST)

                if not file_path:
                    return Response({"message": "Empty PDF"}, status=status.HTTP_204_NO_CONTENT)
                with open(file_path, 'rb') as f:
                    response = HttpResponse(f.read(), content_type='application/pdf')
                content = f"inline; filename={filename}"
                download = request.GET.get("download")
                if download:
                    content = f"attachment; filename={filename}"
                response["Content-Disposition"] = content

                if pdf_method == 'MAIL':
                    compressed_file_path = os.path.join(settings.MEDIA_ROOT, 'pdf_files', f'compressed_{filename}')
                    input_size, output_size = compress_pdf(file_path, compressed_file_path)
                    logging.info(f"the pdf sizes are before {input_size} to {output_size}")
                    file_name = filename
                    subject = email_subject
                    message = email_message
                    message += 'for ' + station.station_name 
                    mp = MailPDF(file_name, file_path, compressed_file_path, subject, message, request, run_thread_event)
                    run_thread_event.clear()
                    logging.info("Thread cleared: _daily_pdf")
                    if run_thread_event.is_set():
                        return Response({"message": "A pdf is already being sent try after sometime"}, status=status.HTTP_200_OK)
                    else:
                        mp.start()
                        logging.info("Thread started: MailPDF")
                        run_thread_event.set()
                        return Response({"message": "Your data is being sent to your Email. Please check your mail later."}, status=status.HTTP_200_OK)

                os.remove(file_path)
                return response
            
            except KeyError as e:
                return Response({"message": f"Data missing: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)

            except Exception as e:
                logging.exception(f"An error occurred in thread  _daily_pdf: {repr(e)}")
                run_thread_event.clear()
                logging.info("Thread cleared: _daily_pdf")
                return Response({"message": "An error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        if pdf_method == 'MAIL':
            thread = threading.Thread(target=_daily_pdf)
            thread.start()
            logging.info("Thread started: _daily_pdf")
            run_thread_event.set()
            return Response({"message": "Your data is being processed. Please check your mail later."}, status=status.HTTP_200_OK)
        else:
            return _daily_pdf()
            
    except Exception as e:
        logging.exception(f"An error occurred in daily_pdf: {repr(e)}")
        run_thread_event.clear()
        logging.info("Thread cleared: _daily_pdf")
        return Response({"message": "An error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
def monthly_pdf(request):
    try:
        if run_thread_event.is_set():
            return Response({"message": "A pdf is already being sent try after sometime"}, status=status.HTTP_200_OK)
        pdf_method = request.GET.get('pdf_method')
        
        def _monthly_pdf():
            try:
                station = request.user.station
                date1 = request.GET['date']
                show_images = request.GET.get('show_images')
                pdf_for = request.GET['pdf_for']
                if pdf_for not in ['monthly_summary', 'monthly_details']:
                    return Response({"message": "Invalid PDF format request"}, status=status.HTTP_400_BAD_REQUEST)

                context = calculate_monthly_data(request, date1)
                date = datetime.datetime.strptime(date1, '%Y-%m-%d').date()
                year = str(date.year)
                month = str(date.month)
                month_name = calendar.month_name[int(month)].capitalize()
                if not context:
                    return Response(
                        {"message": "Error occurred while calculating the monthly data"}, status=status.HTTP_400_BAD_REQUEST)
                if show_images:
                    context['showimages'] = True
                
                if pdf_for == 'monthly_summary':
                    file_name = f"monthly_summary_{month_name}_{station.station_name}.pdf"
                    file_path = html_to_pdf('front/pdf/pdf_monthly.html', context, file_name)
                    email_subject = f'Monthly Summary - {month_name} - {station.station_name}'
                    email_message = f'Monthly Summary for the month: {month_name} of station: {station.station_name} is: ' # rename it to email_body
                elif pdf_for == 'monthly_details':
                    file_name = f"monthly_full_details_{month_name}_{station.station_name}.pdf"
                    email_subject = f'Monthly Details - {month_name} - {station.station_name}'
                    email_message = f'Monthly Full Details for the month: {month_name} of station: {station.station_name} is: '

                    start_date = datetime.date(date.year, date.month, 1)
                    # Get the last day of the month
                    if date.month == 12:
                        end_date = datetime.date(date.year + 1, 1, 1) - datetime.timedelta(days=1)
                    else:
                        end_date = datetime.date(date.year, date.month + 1, 1) - datetime.timedelta(days=1)

                    current_date = start_date
                    daily_buyers_contexts_list = []
                    while current_date <= end_date:
                        daily_buyers_context = DailyData().primary_stations(request, current_date, False)
                        daily_buyers_contexts_list.append(daily_buyers_context)
                        if not daily_buyers_context:
                            return Response({"message": f"No data found for date: {current_date}"}, status=status.HTTP_400_BAD_REQUEST)
                        current_date += datetime.timedelta(days=1)
                    context['context_list'] = daily_buyers_contexts_list
                    file_path = html_to_pdf('front/pdf/pdf.html', context, file_name)
                else:
                    return Response({"message": "Invalid PDF format request"}, status=status.HTTP_400_BAD_REQUEST)
                
                if not file_path:
                    return Response({"message": "Empty PDF"}, status=status.HTTP_204_NO_CONTENT)
                with open(file_path, 'rb') as f:
                    response = HttpResponse(f.read(), content_type='application/pdf')
                content = f"inline; filename={file_name}"
                download = request.GET.get("download")
                if download:
                    content = f"attachment; filename={file_name}"
                response["Content-Disposition"] = content

                if pdf_method == 'MAIL':
                    compressed_file_path = os.path.join(settings.MEDIA_ROOT, 'pdf_files', f'compressed_{file_name}')
                    input_size, output_size = compress_pdf(file_path, compressed_file_path)
                    logging.info(f"the pdf sizes are before {input_size} to {output_size}")
                    file_name = file_name
                    subject = email_subject
                    message = email_message
                    mp = MailPDF(file_name, file_path, compressed_file_path, subject, message, request, run_thread_event)
                    run_thread_event.clear()
                    logging.info("Thread cleared: _monthly_pdf")
                    if run_thread_event.is_set():
                        return Response({"message": "A pdf is already being sent try after sometime"}, status=status.HTTP_200_OK)
                    else:
                        mp.start()
                        logging.info("Thread started: MailPDF")
                        run_thread_event.set()
                        return Response({"message": "Your data is being sent to your Email. Please check your mail later."}, status=status.HTTP_200_OK)

                os.remove(file_path)
                return response

            except KeyError as e:
                return Response({"message": f"Data missing: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)
            
            except Exception as e:
                logging.exception(f"An error occurred in thread _monthly_pdf: {repr(e)}")
                run_thread_event.clear()
                logging.info("Thread cleared: _monthly_pdf")
                return Response({"message": "An error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        if pdf_method == 'MAIL':
            thread = threading.Thread(target=_monthly_pdf)
            thread.start()
            logging.info("Thread started: _monthly_pdf")
            run_thread_event.set()
            return Response({"message": "Your data is being processed. Please check your mail later."}, status=status.HTTP_200_OK)
        else:
            return _monthly_pdf()

    
    except Exception as e:
        logging.exception(f"An error occurred in monthly_pdf: {repr(e)}")
        run_thread_event.clear()
        logging.info("Thread cleared: _monthly_pdf")
        return Response({"message": "An error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
def mail_monthly_daily_reports(request):
    try:
        if run_thread_event.is_set():
            return Response({"message": "A pdf is already being sent try after sometime"}, status=status.HTTP_200_OK)
        
        def _mail_monthly_daily_reports():
            try:
                station = request.user.station
                get_date = request.GET['date']
                show_images = request.GET.get('show_images')
                
                date = datetime.datetime.strptime(get_date, '%Y-%m-%d').date()
                year = str(date.year)
                month = str(date.month)
                month_name = calendar.month_name[int(month)].capitalize()
                num_days = calendar.monthrange(int(year), int(month))

                start_date = datetime.date(date.year, date.month, 1)
                # Get the last day of the month
                if date.month == 12:
                    end_date = datetime.date(date.year + 1, 1, 1) - datetime.timedelta(days=1)
                else:
                    end_date = datetime.date(date.year, date.month + 1, 1) - datetime.timedelta(days=1)

                file_names = []
                file_paths = []
                compressed_file_paths = []
                current_date = start_date
                while current_date <= end_date:
                    if station.station_category in ['A', 'A1']:
                        daily_data_context = DailyData().primary_stations(request, current_date, False)
                    elif station.station_category in ['B', 'D', 'E']:
                        daily_data_context = DailyData().bde_stations(request, station, current_date, True)
                    else:
                        return Response({"message": "Station category not found"}, status=status.HTTP_400_BAD_REQUEST)
            
                    if not daily_data_context:
                        logging.exception(f"Error occurred while generating daily buyers data for date: {current_date}")
                        return False
                    
                    pdf_date = current_date.strftime('%d-%m-%Y')
                
                    sup_summary_ver = False
                    feedback_summary_objects = FeedbackSummaryVerification.objects.filter(
                        station=station, 
                        verified_summary_date=current_date)
                    sup_summary_ver_obj = feedback_summary_objects.filter(
                        verified_by__user_type__name="supervisor").last()
                    if sup_summary_ver_obj:
                        if sup_summary_ver_obj.verification_status:
                            sup_summary_ver = sup_summary_ver_obj
                    
                    con_summary_ver = False
                    con_summary_ver_obj = feedback_summary_objects.filter(
                        verified_by__user_type__name="contractor").last()
                    if con_summary_ver_obj:
                        if con_summary_ver_obj.verification_status:
                            con_summary_ver = con_summary_ver_obj

                    sup_evaluation_ver = False
                    daily_evaluation_objects = DailyEvaluationVerification.objects.filter(
                        station=station, 
                        verified_eval_date=current_date)
                    sup_evaluation_ver_obj = daily_evaluation_objects.filter(
                        verified_by__user_type__name="supervisor").last()
                    if sup_evaluation_ver_obj:
                        if sup_evaluation_ver_obj.verification_status:
                            sup_evaluation_ver = sup_evaluation_ver_obj
                    
                    con_evaluation_ver = False
                    con_evaluation_ver_obj = daily_evaluation_objects.filter(
                        verified_by__user_type__name="contractor").last()
                    if con_evaluation_ver_obj:
                        if con_evaluation_ver_obj.verification_status:
                            con_evaluation_ver = con_evaluation_ver_obj

                    context = {
                        'saved_pdf_date':pdf_date, 'station': station, 'year': year, 'month': month, 'month_name': month_name, 'num_days': num_days[1],
                        # Feedback varification
                        'feedback_date': get_date, 'sup_summary_ver': sup_summary_ver, 'con_summary_ver': con_summary_ver,
                        "sup_evaluation_ver":sup_evaluation_ver,"con_evaluation_ver":con_evaluation_ver,
                    }
                    context.update(daily_data_context)
                    linux_environment = platform.system() == 'Linux'
                    context['linux_environment'] = linux_environment
                    
                    if show_images:
                        context['showimages'] = True

                    filename = f"daily_report_{pdf_date}_{station.station_name}.pdf"
                    if station.station_category in ['A', 'A1']:
                        file_path = html_to_pdf('front/pdf/pdf_daily.html', context, filename)
                    elif station.station_category in ['B', 'D', 'E']:
                        context['daily_report_for_bde'] = True
                        file_path = html_to_pdf('front/pdf/bde_daily.html', context, filename)
                    else:
                        return Response({"message": "Station category not found"}, status=status.HTTP_400_BAD_REQUEST)
                    
                    if not file_path:
                        return Response({"message": f"Empty PDF for date:{pdf_date}"}, status=status.HTTP_204_NO_CONTENT)
                    
                    compressed_file_path = os.path.join(settings.MEDIA_ROOT, 'pdf_files', f'compressed_{filename}')
                    input_size, output_size = compress_pdf(file_path, compressed_file_path)
                    logging.info(f"the pdf sizes are before {input_size} to {output_size}")
                    file_names.append(filename)
                    file_paths.append(file_path)
                    compressed_file_paths.append(compressed_file_path)

                    current_date += datetime.timedelta(days=1)

                subject = f'Daily Reports - {month_name} - {station.station_name}'
                message = f'Daily Reports of month: {month_name} for station: {station.station_name} is: \n'
                mp = MailPDF(file_names, file_paths, compressed_file_paths, subject, message, request, run_thread_event)
                run_thread_event.clear()
                logging.info("Thread cleared: _mail_monthly_daily_reports")
                if run_thread_event.is_set():
                    return Response({"message": "A pdf is already being sent try after sometime"}, status=status.HTTP_200_OK)
                else:
                    mp.start()
                    logging.info("Thread started: MailPDF")
                    run_thread_event.set()
                    return Response({"message": "Your data is being sent to your Email. Please check your mail."}, status=status.HTTP_200_OK)
                
            except KeyError as e:
                return Response({"message": f"Data missing: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)
                
            except Exception as e:
                message = "An error occurred processing monthly data"
                logging.exception(f"{message} in: thread _mail_monthly_daily_reports: {repr(e)}")
                run_thread_event.clear()
                logging.info("Thread cleared: _mail_monthly_daily_reports")
                return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        thread = threading.Thread(target=_mail_monthly_daily_reports)
        thread.start()
        logging.info("Thread started: _mail_monthly_daily_reports")
        run_thread_event.set()
        return Response({"message": "Your data is being processed. Please check your mail later."}, status=status.HTTP_200_OK)
    
    except Exception as e:
        logging.exception(f"An error occurred in mail_monthly_daily_reports: {repr(e)}")
        run_thread_event.clear()
        logging.info("Thread cleared: _mail_monthly_daily_reports")
        return Response({"message": "An error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
def bde_monthly_pdf(request):
    try:
        if run_thread_event.is_set():
            return Response({"message": "A pdf is already being sent try after sometime"}, status=status.HTTP_200_OK)
        pdf_method = request.GET.get('pdf_method')

        def _bde_monthly_pdf():
            try:
                station = request.user.station
                get_date = request.GET['date']
                show_images = request.GET.get('show_images')
                pdf_for = request.GET.get('pdf_for')
                
                is_images = False
                if show_images:
                    is_images = True
                
                date = datetime.datetime.strptime(get_date, '%Y-%m-%d').date()
                formatted_date = date.strftime('%d-%m-%Y')
                now = datetime.datetime.now()
                pdf_year = str(date.year)
                pdf_month = str(date.month)
                pdf_month_name = calendar.month_name[int(pdf_month)].capitalize()
                num_days = calendar.monthrange(int(pdf_year), int(pdf_month))

                start_date = datetime.date(date.year, date.month, 1)
                # Get the last day of the month
                if date.month == 12:
                    end_date = datetime.date(date.year + 1, 1, 1) - datetime.timedelta(days=1)
                else:
                    end_date = datetime.date(date.year, date.month + 1, 1) - datetime.timedelta(days=1)

                current_date = start_date
                total_weekly_buyers_rating = []
                total_weekly_feedback_score = []
                weekly_avg_rating = []
                weekly_avg_feedback = []
                monthly_data = []
                seven_days_eval = []
                seven_days_data = []
                buyers_avg_rating_sum = 0
                feedback_avg_score_sum = 0
                total_daily_eval_sum = 0
                task_images = []
                while current_date <= end_date:
                    daily_data = {}
                    daily_rating_context = DailyData().bde_stations(request, station, current_date, is_images)
                    if not daily_rating_context:
                        logging.exception(f"Error occurred while generating daily buyers data for date: {current_date}")

                    pdf_date = current_date.strftime('%d-%m-%Y')
                    daily_buyers_avg_rating = daily_rating_context.get('avg_rating', 0)
                    daily_feedback_total_avg = daily_rating_context.get('feedback_total_daily', 0)
                    daily_buyers_eval_score = round(daily_buyers_avg_rating * 0.8, 2)
                    feedback_total_daily_score = round(daily_feedback_total_avg * 0.2, 2)
                    buyers_avg_rating_sum += daily_buyers_avg_rating
                    feedback_avg_score_sum += daily_feedback_total_avg
                    total_daily_eval = float("{:.2f}".format(
                        round(daily_buyers_eval_score + feedback_total_daily_score, 2)))
                    if not daily_feedback_total_avg:
                        total_daily_eval = daily_buyers_avg_rating
                    total_daily_eval_sum += total_daily_eval
                    
                    daily_data['date'] = pdf_date
                    daily_data['daily_buyers_avg_rating'] = daily_buyers_avg_rating
                    daily_data['daily_feedback_total_avg'] = daily_feedback_total_avg
                    daily_data['total_daily_score'] = total_daily_eval
                    daily_data['seven_days_avg_eval'] = None

                    seven_days_eval.append(total_daily_eval)
                    seven_days_data.append(daily_data)
                    total_weekly_buyers_rating.append(daily_buyers_avg_rating)
                    total_weekly_feedback_score.append(daily_feedback_total_avg)
                    if len(seven_days_eval) == 7:
                        seven_days_avg_eval = round(sum(seven_days_eval) / 7, 2) or 'N/A'
                        seven_days_data[0]['seven_days_avg_eval'] = seven_days_avg_eval
                        weekly_avg_rating.append(round(sum(total_weekly_buyers_rating) / 7, 2))
                        weekly_avg_feedback.append(round(sum(total_weekly_feedback_score) / 7, 2))
                        seven_days_eval = []
                        seven_days_data = []
                        total_weekly_buyers_rating = []
                        total_weekly_feedback_score = []

                    monthly_data.append(daily_data)
                    task_images.append(daily_rating_context.get('images', []))
                    current_date += datetime.timedelta(days=1)

                avg_total_buyers_rating = round(buyers_avg_rating_sum / num_days[1], 2)
                final_buyers_score = round(0.8 * avg_total_buyers_rating, 2)
                avg_total_feedback_score = round(feedback_avg_score_sum / num_days[1], 2)
                final_feedback_score = round(0.2 * avg_total_feedback_score, 2)
                avg_total_daily_eval = round(total_daily_eval_sum / num_days[1], 2)
                final_buyers_feedback_sum = round(final_buyers_score + final_feedback_score, 2)
                if not final_feedback_score:
                    final_buyers_feedback_sum = avg_total_buyers_rating

                weekly_data = []
                for i in range(0, 4):
                    week_data = {}
                    week_data['rating'] = round(0.8 * weekly_avg_rating[i], 2)
                    week_data['feedback'] = round(0.2 * weekly_avg_feedback[i], 2)
                    week_data['total'] = round(week_data['rating'] + week_data['feedback'], 2)
                    if not week_data['feedback']:
                        week_data['total'] = weekly_avg_rating[i]
                    weekly_data.append(week_data)

                context = {
                    'is_prod': os.getenv('ENV') == 'PROD',
                    'is_images': is_images,
                    'station': station,
                    'start_date': start_date,
                    'end_date': end_date,
                    'current_date': formatted_date,
                    'now': now,
                    'pdf_month_name': pdf_month_name,
                    'monthly_data': monthly_data,
                    'month_name': pdf_month_name,
                    'avg_total_feedback_score': avg_total_feedback_score,
                    'avg_total_buyers_rating': avg_total_buyers_rating,
                    'avg_total_daily_eval': avg_total_daily_eval,
                    'weekly_data': weekly_data,
                    'weekly_avg_rating': weekly_avg_rating,
                    'weekly_avg_feedback': weekly_avg_feedback,
                    'final_feedback_score': final_feedback_score,
                    'final_buyers_score': final_buyers_score,
                    'final_buyers_feedback_sum': final_buyers_feedback_sum
                }

                filename = f"monthly_summary_{pdf_month_name}_{station.station_name}.pdf"
                file_path = html_to_pdf('front/pdf/bde_monthly.html', context, filename)

                if not file_path:
                    return Response({"message": "Empty PDF"}, status=status.HTTP_204_NO_CONTENT)
                with open(file_path, 'rb') as f:
                    response = HttpResponse(f.read(), content_type='application/pdf')
                content = f"inline; filename={filename}"
                download = request.GET.get("download")
                if download:
                    content = f"attachment; filename={filename}"
                response["Content-Disposition"] = content

                if pdf_method == 'MAIL':
                    compressed_file_path = os.path.join(settings.MEDIA_ROOT, 'pdf_files', f'compressed_{filename}')
                    input_size, output_size = compress_pdf(file_path, compressed_file_path)
                    logging.info(f"the pdf sizes are before {input_size} to {output_size}")
                    file_name = filename
                    subject = f"Monthly Summary - {pdf_month_name}"
                    message = f"Monthly Summary of {station.station_name} for {pdf_month_name}"
                    mp = MailPDF(file_name, file_path, compressed_file_path, subject, message, request, run_thread_event)
                    run_thread_event.clear()
                    logging.info("Thread cleared: _bde_monthly_pdf")
                    if run_thread_event.is_set():
                        return Response({"message": "A pdf is already being sent try after sometime"}, status=status.HTTP_200_OK)
                    else:
                        mp.start()
                        logging.info("Thread started: MailPDF")
                        run_thread_event.set()
                        return Response({"message": "Your data is being sent to your Email. Please check your mail later."}, status=status.HTTP_200_OK)

                os.remove(file_path)
                return response
            
            except KeyError as e:
                return Response({"message": f"Data missing: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)
            
            except Exception as e:
                logging.exception(f"An error occurred in thread _bde_monthly_pdf: {repr(e)}")
                run_thread_event.clear()
                logging.info("Thread cleared: _bde_monthly_pdf")
                return Response({"message": "An error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        if pdf_method == 'MAIL':
            thread = threading.Thread(target=_bde_monthly_pdf)
            thread.start()
            logging.info("Thread started: _bde_monthly_pdf")
            run_thread_event.set()
            return Response({"message": "Your data is being processed. Please check your mail later."}, status=status.HTTP_200_OK)
        else:
            return _bde_monthly_pdf()
        
    except Exception as e:
        logging.exception(f"An error occurred in bde_monthly_pdf: {repr(e)}")
        run_thread_event.clear()
        logging.info("Thread cleared: _bde_monthly_pdf")
        return Response({"message": "An error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
def bde_daily_consolidated_pdf(request):
    try:
        if run_thread_event.is_set():
            return Response({"message": "A pdf is already being sent try after sometime"}, status=status.HTTP_200_OK)
        pdf_method = request.GET.get('pdf_method')

        def _bde_daily_consolidated_pdf():
            try:
                get_date = request.GET['date']
                date = datetime.datetime.strptime(get_date, '%Y-%m-%d').date()
                pdf_date = date.strftime('%d-%m-%Y')

                stations = Station.objects.filter(
                    is_active=True, 
                    station_category__in=['B', 'D', 'E']
                ).order_by('station_category')

                stations_data = []
                total_avg_rating = 0
                total_avg_feedback = 0
                total_overall_score = 0
                for station in stations:
                    station_daily_data_context = DailyData().bde_stations(request, station, date, False)
                    if not station_daily_data_context:
                        logging.exception(f"No data found for station: {station.station_name}")

                    daily_rating_avg = station_daily_data_context['avg_rating']
                    daily_avg_feedback = station_daily_data_context['feedback_total_daily']
                    daily_overall_score = round((daily_rating_avg * 0.8) + (daily_avg_feedback * 0.2), 2)
                    if not daily_avg_feedback:
                        daily_overall_score = daily_rating_avg

                    chi_verified = False
                    contra_verified = False
                    digital_signs = station_daily_data_context['verified_shifts']
                    if digital_signs:
                        for sign in digital_signs:
                            if sign.verified_by.user_type.name in ['supervisor', 'chi_sm']:
                                chi_verified = True
                            elif sign.verified_by.user_type.name == 'contractor':
                                contra_verified = True
                            
                    station_daily_data = {
                        'station': station,
                        'rating_avg': daily_rating_avg,
                        'feedback_avg': daily_avg_feedback,
                        'overall_score': daily_overall_score,
                        'chi_verified': chi_verified,
                        'contra_verified': contra_verified
                    }
                    total_avg_rating += daily_rating_avg
                    total_avg_feedback += daily_avg_feedback
                    total_overall_score += daily_overall_score
                    stations_data.append(station_daily_data)
                
                avg_total_avg_rating = round(total_avg_rating / len(stations), 2)
                avg_total_avg_feedback = round(total_avg_feedback / len(stations), 2)
                avg_total_overall_score = round(total_overall_score / len(stations), 2)
                context = {
                    'stations_data': stations_data,
                    'avg_total_avg_rating': avg_total_avg_rating,
                    'avg_total_avg_feedback': avg_total_avg_feedback,
                    'avg_total_overall_score': avg_total_overall_score,
                    'now': datetime.datetime.now(),
                    'date': pdf_date,
                }

                filename = f"BDE_consolidated_daily_data_{pdf_date}.pdf"
                file_path = html_to_pdf('front/pdf/bde_daily_consolidated_pdf.html', context, filename)
                if not file_path:
                    return Response({"message": "Empty PDF"}, status=status.HTTP_204_NO_CONTENT)

                with open(file_path, 'rb') as f:
                    response = HttpResponse(f.read(), content_type='application/pdf')
                content = f"inline; filename={filename}"
                download = request.GET.get("download")
                if download:
                    content = f"attachment; filename={filename}"
                response["Content-Disposition"] = content

                if pdf_method == 'MAIL':
                    compressed_file_path = os.path.join(settings.MEDIA_ROOT, 'pdf_files', f'compressed_{filename}')
                    input_size, output_size = compress_pdf(file_path, compressed_file_path)
                    logging.info(f"the pdf sizes are before {input_size} to {output_size}")
                    file_name = filename
                    subject = f"BDE Consolidated Daily Data - {pdf_date}"
                    message = f"Consolidated Daily Data of BDE stations for the date: {pdf_date} is: "
                    mp = MailPDF(file_name, file_path, compressed_file_path, subject, message, request, run_thread_event)
                    run_thread_event.clear()
                    logging.info("Thread cleared: _bde_daily_consolidated_pdf")
                    if run_thread_event.is_set():
                        return Response({"message": "A pdf is already being sent try after sometime"}, status=status.HTTP_200_OK)
                    else:
                        mp.start()
                        logging.info("Thread started: MailPDF")
                        run_thread_event.set()
                        return Response({"message": "Your data is being sent to your Email. Please check your mail."}, status=status.HTTP_200_OK)

                os.remove(file_path)
                return response

            except KeyError as e:
                return Response({"message": f"Data missing: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)

            except Exception as e:
                message = "An error occurred while processing consolidated data of stations"
                logging.exception(f"{message} in thread: _bde_daily_consolidated_pdf: {repr(e)}")
                run_thread_event.clear()
                logging.info("Thread cleared: _bde_daily_consolidated_pdf")
                return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        if pdf_method == 'MAIL':
            thread = threading.Thread(target=_bde_daily_consolidated_pdf)
            thread.start()
            logging.info("Thread started: _bde_daily_consolidated_pdf")
            run_thread_event.set()
            return Response({"message": "Your data is being processed. Please check your mail later."}, status=status.HTTP_200_OK)
        else:
            return _bde_daily_consolidated_pdf()
        
    except Exception as e:
        logging.exception(f"An error occurred in bde_daily_consolidated_pdf: {repr(e)}")
        run_thread_event.clear()
        logging.info("Thread cleared: _bde_daily_consolidated_pdf")
        return Response({"message": "An error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
@allowed_users(['railway admin', 'supervisor', 'contractor', 'officer', 'chi_sm'])
def which_pdf(request):
    try:
        user_agent = parse(request.META.get('HTTP_USER_AGENT', ''))
        logging.info(f"User Device: {user_agent}")
        if user_agent.is_mobile:
            warning_message = 'PDF cannot be reviewed on this device'
            device = 'mobile'
            return Response({'warning_message': warning_message, 'device': device}, status=status.HTTP_200_OK)
        elif user_agent.is_pc:
            warning_message = 'PDF can be downlaoded and reviewed on this device'
            device = 'pc'
            return Response({'warning_message': warning_message, 'device': device}, status=status.HTTP_200_OK)
        elif user_agent.is_tablet:
            warning_message = 'PDF cannot be reviewed on this device'
            device = 'tablet'
            return Response({'warning_message': warning_message, 'device': device}, status=status.HTTP_200_OK)

        messages = []
        messages.append("You don't have enough rights")

        return Response({'messages': messages}, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logging.exception(f"An error occurred in which_pdf: {repr(e)}")
        return Response({"message": "An error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# HERE pdf_daily.html is rendered
@api_view(['GET'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
def get_pre_daily_feedback(request):
    try:
        station = request.user.station
        context = {}
        date1 = request.GET.get('date')
        
        if request.method == 'GET':
            if date1 is not None:
                date = datetime.datetime.strptime(date1, '%Y-%m-%d').date()
            else:
                date = datetime.datetime.now().date()
            formatted_date = date.strftime('%d-%m-%Y')
            formatted_date_time = date.strftime('%d %m %Y %H:%M:%S')

            year = str(date.year)
            month = str(date.month)
            month_name = calendar.month_name[int(month)].upper()
            num_days = calendar.monthrange(int(year), int(month))

            scores_sum = 'N/A'
            feedback_data = ''
            feedback_ids = [] 
            feedback_user = []
            try:
                feedback_data = list(FeedbackAPI().get(
                    request, station_code=station.station_code, date=date))
                if feedback_data is None:
                    feedback_data = ''

                for feedback_each in feedback_data:
                    feedback_ids.append(feedback_each.id)
                    feedback_user.append(feedback_each.user.username)

                poor_count = 0
                ok_count = 0
                excellent_count = 0
                for feedback_each in feedback_data:
                    if feedback_each.feedback_value_1 == '0':
                        poor_count = poor_count + 1
                    if feedback_each.feedback_value_2 == '0':
                        poor_count = poor_count + 1
                    if feedback_each.feedback_value_3 == '0':
                        poor_count = poor_count + 1
                    if feedback_each.feedback_value_4 == '0':
                        poor_count = poor_count + 1
                    if feedback_each.feedback_value_5 == '0':
                        poor_count = poor_count + 1
                    if feedback_each.feedback_value_1 == '1':
                        ok_count = ok_count + 1
                    if feedback_each.feedback_value_2 == '1':
                        ok_count = ok_count + 1
                    if feedback_each.feedback_value_3 == '1':
                        ok_count = ok_count + 1
                    if feedback_each.feedback_value_4 == '1':
                        ok_count = ok_count + 1
                    if feedback_each.feedback_value_5 == '1':
                        ok_count = ok_count + 1
                    if feedback_each.feedback_value_1 == '2':
                        excellent_count = excellent_count + 1
                    if feedback_each.feedback_value_2 == '2':
                        excellent_count = excellent_count + 1
                    if feedback_each.feedback_value_3 == '2':
                        excellent_count = excellent_count + 1
                    if feedback_each.feedback_value_4 == '2':
                        excellent_count = excellent_count + 1
                    if feedback_each.feedback_value_5 == '2':
                        excellent_count = excellent_count + 1

                tot_count = poor_count + ok_count + excellent_count

                if tot_count == 0:
                    scores = [0, 0, 0]
                else:
                    scores = [excellent_count * 1, ok_count * 0.9, poor_count * 0]

                daily_per_total_score = round((sum(scores) * 100) / tot_count, 2)
                feedback_total_daily = daily_per_total_score
                if daily_per_total_score == 0:
                    feedback_total_daily = 0
                else:
                    feedback_total_daily = feedback_total_daily
                if scores:
                    scores_sum = sum(scores)
                else:
                    scores_sum = 'N/A'
            except Exception as e:
                daily_per_total_score = 'N/A'
                scores = ['N/A', 'N/A', 'N/A']
                scores_sum = 'N/A'
                feedback_data = ''
                ok_count = 'N/A'
                poor_count = 'N/A'
                excellent_count = 'N/A'
                tot_count = 'N/A'
                feedback_total_daily = 0
            
            current_user = request.user.username
            sup = request.user.user_type
            
            sup_summary_ver = False
            sup_summary_ver_obj = FeedbackSummaryVerification.objects.filter(station=station, verified_summary_date=date1, verified_by__user_type__name = "supervisor").last()
            if(sup_summary_ver_obj):
                sup_summary_ver = sup_summary_ver_obj.verification_status
            
            con_summary_ver = False
            con_summary_ver_obj = FeedbackSummaryVerification.objects.filter(station=station, verified_summary_date=date1, verified_by__user_type__name = "contractor").last()
            if(con_summary_ver_obj):
                con_summary_ver = con_summary_ver_obj.verification_status

            context = {
                'date': date, 'station': station, 'year': year, 'month': month, 'month_name': month_name,
                'num_days': num_days[1], 'station_name': station.station_name, 'current_user': current_user, 'sup': sup,
                'feedback_date': date1, 'sup_summary_ver': sup_summary_ver, 'con_summary_ver': con_summary_ver,
                # feedback forms
                'passenger_feedback_data': [x for x in feedback_data], 'excellent_count': excellent_count, 'ok_count': ok_count, 'poor_count': poor_count, 'scores': scores, 'scores_sum': scores_sum, 'daily_per_total_score': daily_per_total_score, 'feedback_total_daily': feedback_total_daily, 'tot_count': tot_count,'formatted_date':formatted_date,
                'authorization_header': request.headers['Authorization'],
                "REQ_URL":REQ_URL,
            }

            return render(request, 'front/pdf/preview_feedback.html', context)
        
        messages = []
        messages.append("Please select a date to generate a report")

        return Response({'messages': messages, 'context': context}, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logging.exception(f"An error occurred in get_pre_daily_feedback: {repr(e)}")
        return Response({"message": "An error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
def signature_daily_evaluation(request):
    try:
        context = {}
        if request.method == 'GET':
            station = request.user.station
            date1 = request.GET.get('date')

            if not date1:
                return Response({"message": "Date is missing"}, status=status.HTTP_400_BAD_REQUEST)
            
            date = datetime.datetime.strptime(date1, '%Y-%m-%d').date()
            formatted_date = date.strftime('%d %b. %Y')
            
            sum_task = 0
            non_daily_tasks_first = []
            for taskk in Task.objects.filter(station=station).all().order_by('task_id'):
                occurrence = TaskShiftOccurrence.objects.filter(task=taskk).all()
                sum_rating = 0

                for occ in occurrence:
                    rating = Rating.objects.filter(
                        task_shift_occur_id=occ, date=date).last()
                    if (rating is not None):
                        if rating.rating_value is not None:
                            sum_rating = sum_rating+float(rating.rating_value)
                        else:
                            sum_rating = sum_rating+0
                    else:
                        sum_rating = sum_rating+0
                sum_task = sum_task+sum_rating
                if taskk.cleaning_cycle_type != 'D' and sum_rating > 0:
                    non_daily_tasks_first.append(taskk.cleaning_cycle_type)


            max_rating_first = 0

            for taskk in Task.objects.filter(station=station,).all():
                if (valid_task_date(taskk.id, date)):
                    if (taskk.cleaning_cycle_type == 'D'):
                        max_rating_first = max_rating_first + \
                            int(taskk.cleaning_cycle_day_freq)*4
                    elif (taskk.cleaning_cycle_type in non_daily_tasks_first):
                        max_rating_first = max_rating_first + \
                            int(taskk.cleaning_cycle_day_freq)*4
            percentage = round((sum_task/max_rating_first)*100, 2)
            if percentage == 0:
                daily_buyers_eval = 0
            else:
                daily_buyers_eval = percentage


            scores_sum = 'N/A'
            feedback_data = ''
            try:
                feedback_data = list(FeedbackAPI().get(
                    request, station_code=station.station_code, date=date))
                if feedback_data is None:
                    feedback_data = ''

                poor_count = 0
                ok_count = 0
                excellent_count = 0
                for feedback_each in feedback_data:
                    if feedback_each.feedback_value_1 == '0':
                        poor_count = poor_count + 1
                    if feedback_each.feedback_value_2 == '0':
                        poor_count = poor_count + 1
                    if feedback_each.feedback_value_3 == '0':
                        poor_count = poor_count + 1
                    if feedback_each.feedback_value_4 == '0':
                        poor_count = poor_count + 1
                    if feedback_each.feedback_value_5 == '0':
                        poor_count = poor_count + 1
                    if feedback_each.feedback_value_1 == '1':
                        ok_count = ok_count + 1
                    if feedback_each.feedback_value_2 == '1':
                        ok_count = ok_count + 1
                    if feedback_each.feedback_value_3 == '1':
                        ok_count = ok_count + 1
                    if feedback_each.feedback_value_4 == '1':
                        ok_count = ok_count + 1
                    if feedback_each.feedback_value_5 == '1':
                        ok_count = ok_count + 1
                    if feedback_each.feedback_value_1 == '2':
                        excellent_count = excellent_count + 1
                    if feedback_each.feedback_value_2 == '2':
                        excellent_count = excellent_count + 1
                    if feedback_each.feedback_value_3 == '2':
                        excellent_count = excellent_count + 1
                    if feedback_each.feedback_value_4 == '2':
                        excellent_count = excellent_count + 1
                    if feedback_each.feedback_value_5 == '2':
                        excellent_count = excellent_count + 1

                tot_count = poor_count + ok_count + excellent_count

                if tot_count == 0:
                    scores = [0, 0, 0]
                else:
                    scores = [excellent_count * 1, ok_count * 0.9, poor_count * 0]

                daily_per_total_score = round((sum(scores) * 100) / tot_count, 2)
                feedback_total_daily = daily_per_total_score
                if daily_per_total_score == 0:
                    feedback_total_daily = 0
                else:
                    feedback_total_daily = feedback_total_daily
                if scores:
                    scores_sum = sum(scores)
                else:
                    scores_sum = 'N/A'
            except Exception as e:
                daily_per_total_score = 'N/A'
                scores = ['N/A', 'N/A', 'N/A']
                scores_sum = 'N/A'
                feedback_data = ''
                ok_count = 'N/A'
                poor_count = 'N/A'
                excellent_count = 'N/A'
                tot_count = 'N/A'
                feedback_total_daily = 0

            # pdf Page 4 DAILY EVALUATION SHEET FOR DEDUCTION PURPOSE
            daily_buyers_eval_score = round(daily_buyers_eval * 0.8, 2)
            feedback_total_daily_score = round(feedback_total_daily * 0.2, 2)
            total_daily_eval = float("{:.2f}".format(
                round(daily_buyers_eval_score + feedback_total_daily_score, 2)))

            sup = request.user.user_type

            sup_evaluation_ver = False
            sup_evaluation_ver_obj = DailyEvaluationVerification.objects.filter(station=station, verified_eval_date=date1, verified_by__user_type__name = "supervisor").last()
            if(sup_evaluation_ver_obj):
                sup_evaluation_ver = sup_evaluation_ver_obj.verification_status
            
            con_evaluation_ver = False
            con_evaluation_ver_obj = DailyEvaluationVerification.objects.filter(station=station, verified_eval_date=date1, verified_by__user_type__name = "contractor").last()
            if(con_evaluation_ver_obj):
                con_evaluation_ver = con_evaluation_ver_obj.verification_status

            # Now we will use total_daily_eval to calculate the penalty
            accepted_daily_rate = station.station_penalty
            daily_penalty_applied = None
            deduction_rate = None
            if accepted_daily_rate is not None:
                rate_cal = calculate_penalty(accepted_daily_rate, total_daily_eval)
                if rate_cal is not None:
                    daily_penalty_applied = rate_cal['penalty']
                    deduction_rate = rate_cal['deduction_rate']
                else:
                    daily_penalty_applied = 0.0
                    deduction_rate = 0
            else:
                accepted_daily_rate = 0.0
                daily_penalty_applied = 0.0
                deduction_rate = 0

            context = {
                "station" : station, "formatted_date":formatted_date, "daily_buyers_eval":daily_buyers_eval,"daily_buyers_eval_score":daily_buyers_eval_score,
                "feedback_total_daily":feedback_total_daily, "feedback_total_daily_score":feedback_total_daily_score,"total_daily_eval":total_daily_eval,
                # Penalty
                "accepted_daily_rate": accepted_daily_rate, "daily_penalty_applied": daily_penalty_applied, "deduction_rate": deduction_rate, 'station_name': station.station_name, 
                # Feedback validation
                "sup":sup, "evaluation_date":date1,"sup_evaluation_ver":sup_evaluation_ver,"con_evaluation_ver":con_evaluation_ver,
            }

            return render(request, 'front/pdf/ver_daily_eval_sheet.html', context)
        
        return render(request, 'front/pdf/ver_daily_eval_sheet.html', context)
    
    except Exception as e:
        logging.exception(f"An error occurred in signature_daily_Evaluation: {repr(e)}")
        return Response({"message": "An error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@allowed_users(['railway admin', 'officer', 'railway manager', 'chi_sm'])
def complaints_pdf(request, date):
    try:
        if run_thread_event.is_set():
            return Response({"message": "A pdf is already being sent try after sometime"}, status=status.HTTP_200_OK)
        pdf_method = request.GET.get('pdf_method')

        def _complaints_pdf(date):
            try:
                user = request.user
                station = user.station
                complaint_range = request.GET.get('complaint_range')
                date = datetime.datetime.strptime(date, "%Y-%m-%d")
                if complaint_range == 'month':
                    start = date.replace(day=1)
                    end = start + relativedelta(months=1) - datetime.timedelta(days=1)
                else:
                    start = date
                    end = start + datetime.timedelta(days=1)
                complaints_for = date.strftime('%B') if complaint_range == 'month' else date.date()
                stations = Station.objects.all()
                complaints = notified_data.objects.select_related('task').prefetch_related('images').filter(
                    date__range=(start, end))
                station_categories = ['A1', 'A', 'B', 'D', 'E']
                stations_list = []
                station_complaints_list = []
                no_complaints_list = []

                for category in station_categories:
                    category_stations = stations.filter(station_category=category)
                    stations_list.append(category_stations)
                    no_complaints = []
                    for station in category_stations:
                        station_complaints = complaints.filter(user__station=station)
                        if station_complaints.exists():
                            station_complaints_list.append(station_complaints)
                            continue
                        no_complaints.append(station.station_name)
                    no_complaints_list.append(no_complaints if no_complaints else None)

                combined_list = zip(station_categories, stations_list, no_complaints_list)
                context = {
                    'is_prod': os.getenv('ENV') == 'PROD',
                    'combined_list': combined_list,
                    'complaints': station_complaints_list, 
                    'complaints_for': complaints_for, 
                    'date': date.now(),
                    'user': user
                }
                
                filename = f"Complaints_{complaints_for}.pdf"
                file_path = html_to_pdf("front/pdf/complaints_details.html", context, filename)
                if not file_path:
                    return Response({"message": "Empty PDF"}, status=status.HTTP_204_NO_CONTENT)
                compressed_file_path = os.path.join(settings.MEDIA_ROOT, 'pdf_files', f'compressed_{filename}')
                input_size, output_size = compress_pdf(file_path, compressed_file_path)
                logging.info(f"the pdf sizes are before {input_size} to {output_size}")

                if pdf_method == 'MAIL':
                    file_name = f"Complaints_{complaints_for}.pdf"
                    if complaint_range == 'month':
                        subject = f'Monthly Complaints - {station.station_name} - {complaints_for}'
                        message = f'Monthly complaints details of {station.station_name} for the month: {complaints_for} is: '
                    else:
                        subject = f'Daily Complaints - {station.station_name} - {complaints_for}'
                        message = f'Daily complaints details of {station.station_name} for the date: {complaints_for} is: '
                    mp = MailPDF(file_name, file_path, compressed_file_path, subject, message, request, run_thread_event)
                    run_thread_event.clear()
                    logging.info("Thread cleared: _complaints_pdf")
                    if run_thread_event.is_set():
                        return Response({"message": "A pdf is already being sent try after sometime"}, status=status.HTTP_200_OK)
                    else:
                        mp.start()
                        logging.info("Thread started: MailPDF")
                        run_thread_event.set()
                        return Response({"message": "Your data is being sent to your Email. Please check your mail."}, status=status.HTTP_200_OK)

                with open(file_path, 'rb') as f:
                    response = HttpResponse(f.read(), content_type='application/pdf')
                content = f"inline; filename={filename}"
                download = request.GET.get("download")
                if download:
                    content = f"attachment; filename={filename}"
                response["Content-Disposition"] = content
                os.remove(file_path)
                os.remove(compressed_file_path)

                return response
            
            except Exception as e:
                message = 'An error occurred while generating pdf'
                logging.exception(f"{message} in thread _complain_pdf: {repr(e)}")
                run_thread_event.clear()
                logging.info("Thread cleared: _complaints_pdf")
                return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        if pdf_method == 'MAIL':
            thread = threading.Thread(target=_complaints_pdf)
            thread.start()
            logging.info("Thread started: _complaints_pdf")
            run_thread_event.set()
            return Response({"message": "Your data is being processed. Please check your mail later."}, status=status.HTTP_200_OK)
        else:
            return _complaints_pdf(date)
        
    except Exception as e:
        logging.exception(f"An error occurred in complaints_pdf: {repr(e)}")
        run_thread_event.clear()
        logging.info("Thread cleared: _complaints_pdf")
        return Response({"message": "An error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
