import logging
import fitz  
from django.core.mail import EmailMessage
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload
from io import BytesIO
from django.template.loader import get_template
from xhtml2pdf import pisa 
import os
import platform
from django.conf import settings
import calendar
import datetime
from django.db.models import Exists, OuterRef

from task.models import Task
from shift.models import Shift, Verified_shift
from ratings.models import Rating
from pax_deployed.models import Pax
from task_shift_occurrence.models import TaskShiftOccurrence
from website.utils import (
    find_occurrence_list, 
    update_rating_status
    )
from feedback.views import FeedbackAPI
from inspection_feedback.models import Inspection_feedback


def calculate_daily_feedback(passenger_feedback_data, inspection_feedback_data):
    # pdf Page 2 FEEDBACK FORMS
    scores_sum = 'N/A'
    feedback_total_daily = 0

    try:
        feedback_values = {'0': 0, '1': 0, '2': 0}
        feedback_data = ''
        poor_count, ok_count, excellent_count, tot_count = 0, 0, 0, 0
        if passenger_feedback_data:
            feedback_data = passenger_feedback_data
            for feedback in feedback_data:
                for i in range(1, 6):
                    value = getattr(feedback, f'feedback_value_{i}', None)
                    if value in feedback_values:
                        feedback_values[value] += 1
            tot_count = sum(feedback_values.values())
        elif inspection_feedback_data:
            rating = inspection_feedback_data.rating
            if rating == 'Excellent':
                feedback_values['2'] += 1
            elif rating == 'OK':
                feedback_values['1'] += 1
            elif rating == 'Poor':
                feedback_values['0'] += 1
            tot_count = sum(feedback_values.values())
        poor_count, ok_count, excellent_count = feedback_values['0'], feedback_values['1'], feedback_values['2']
        if tot_count == 0:
            scores = [0, 0, 0]
            daily_per_total_score = 0
        else:
            scores = [excellent_count * 1, ok_count * 0.9, poor_count * 0]
            daily_per_total_score = round((sum(scores) * 100) / tot_count, 2)

        feedback_total_daily = daily_per_total_score
        if scores:
            scores_sum = sum(scores)
        else:
            scores_sum = 'N/A'
    except Exception as e:
        logging.exception(f"Error occurred while fetching the feedback values in the pdf: {repr(e)}")

    context = {
        'daily_per_total_score': daily_per_total_score,
        'scores': scores,
        'scores_sum': scores_sum,
        'ok_count': ok_count,
        'poor_count': poor_count,
        'excellent_count': excellent_count,
        'tot_count': tot_count,
        'feedback_total_daily': feedback_total_daily,
    }
    return context


class DailyData():
    def primary_stations(self, request, date, is_buyers_sheet):
        try:
            #option 1: sleep(5 sec)
            #option 2: webhook: API call triggers, and the response of the API will be send, and in back ground the mail will be triggered.
            # restrict user to request for new Mail monthly Details(with Image), for 30 mins.
            
            station = request.user.station
            formatted_date = date.strftime('%d-%m-%Y')

            all_tasks = Task.objects.filter(
                station=station
                ).prefetch_related('occurrences__ratings').order_by('task_id')
            all_shifts = Shift.objects.filter(
                station=station).all().order_by('shift_id')
            
            update_rating_status(request.user.username, station, str(date))

            task_1 = all_tasks.filter(task_type='A').order_by('task_id')
            task_2 = all_tasks.filter(task_type='B').order_by('task_id')
            task_3 = all_tasks.filter(task_type='C').order_by('task_id')
            occurrence_list_A = find_occurrence_list(list(task_1), list(all_shifts))
            occurrence_list_B = find_occurrence_list(list(task_2), list(all_shifts))
            occurrence_list_C = find_occurrence_list(list(task_3), list(all_shifts))

            non_daily_tasks_first = []
            task_A = []
            task_B = []
            task_C = []
            rating_sum_all = 0
            max_rating_sum = 0
            for task in all_tasks:
                max_ratings = (4 * (task.occurrences.filter(rating_required=True).count()))
                max_rating_sum += max_ratings
                occurrences = TaskShiftOccurrence.objects.filter(task=task).all()
                sum_rating = 0
                for occ in occurrences:
                    rating = Rating.objects.filter(
                        task_shift_occur_id=occ, date=date).last()
                    if rating is not None:
                        if rating.rating_value is not None:
                            sum_rating += float(rating.rating_value)
                        else:
                            sum_rating += 0
                    else:
                        sum_rating += 0
                if station.station_name == 'KIUL' and max_ratings:
                    sum_rating = round((sum_rating * 100) / max_ratings, 2)
                rating_sum_all += sum_rating
                if task.cleaning_cycle_type != 'D' and sum_rating > 0:
                    non_daily_tasks_first.append(task.cleaning_cycle_type)

                if task.task_type == 'A':
                    task_A.append({'task': task, 'max_ratings': max_ratings, 'sum': sum_rating})
                elif task.task_type == 'B':
                    task_B.append({'task': task, 'max_ratings': max_ratings, 'sum': sum_rating})
                elif task.task_type == 'C':
                    task_C.append({'task': task, 'max_ratings': max_ratings, 'sum': sum_rating})

            rating_sum_all = round(rating_sum_all, 2)
            percentage = round((rating_sum_all/max_rating_sum)*100, 2)

            # Calculations are different for KIUL.
            if station.station_name == 'KIUL':
                # Filter all TaskShiftOccurrence instances for a specific station and date where rating is required.
                task_shift_occurrence_subquery = TaskShiftOccurrence.objects.filter(
                    task=OuterRef('pk'), task__station=station, rating_required=True)
                # This will give us all the tasks that need to be rated for that particular station on the specified date.
                tasks_with_rating_required_num = Task.objects.filter(
                    Exists(task_shift_occurrence_subquery)).count()
                percentage = round(rating_sum_all/tasks_with_rating_required_num, 2)

            if percentage == 0:
                daily_buyers_eval = 0
            else:
                daily_buyers_eval = percentage

            verified_shifts = []
            pax = []
            shifts_list = []
            one_shift_verified_sup = False
            one_shift_verified_con = False
            for shift in all_shifts:
                # fetching pax counts
                if (Pax.objects.filter(shift=shift, date=date).first()):
                    pax.append(Pax.objects.filter(
                        shift=shift, date=date).first().count)
                else:
                    pax.append(0)

                # fetching verified shifts
                all_verified_shifts = Verified_shift.objects.filter(
                    shift=shift, 
                    verified_shift_date=date,
                )

                verified_shift_object1 =  all_verified_shifts.filter(
                    verified_by__user_type__name="supervisor").last()
                verified_shift_object2 = all_verified_shifts.filter(
                    verified_by__user_type__name="contractor").last()
                if verified_shift_object1:
                    if(station.station_name == 'PNBE') or one_shift_verified_sup == False:
                        one_shift_verified_sup = True
                        if verified_shift_object1.verification_status == True:
                            verified_shifts.append(verified_shift_object1)
                    
                if verified_shift_object2:
                    if(station.station_name == 'PNBE') or one_shift_verified_con == False:
                        one_shift_verified_con = True
                        if verified_shift_object2.verification_status == True:
                            verified_shifts.append(verified_shift_object2)

                shifts_list.append(shift)

            buyers_sheet_context = {
                'pax': pax, 
                'shift': shifts_list, 
                'date': date, 
                'station': station, 
                'formatted_date': formatted_date,
                'task_A': task_A,
                'task_B': task_B,
                'task_C': task_C,
                'occurrence_list_A': occurrence_list_A,
                'occurrence_list_B': occurrence_list_B,
                'occurrence_list_C': occurrence_list_C,
                'non_daily_tasks': non_daily_tasks_first,
                'rating_sum_all': rating_sum_all, 
                'max_rating': max_rating_sum,
                'daily_buyers_eval': percentage,
                'percentage': percentage,
                'verified_shifts' : verified_shifts,
            }

            if is_buyers_sheet:
                return buyers_sheet_context

            feedback_total_daily = 0
            passenger_feedback_data = list(FeedbackAPI().get(
                request, station_code=station.station_code, date=date)) or []
            inspection_feedback_data = Inspection_feedback.objects.filter(
                date=date, 
                station=station
            ).prefetch_related('feedback_images').order_by('-created_at').first()
            # we need to neglect user feedbacks if there is any inspection feedback
            if inspection_feedback_data:
                passenger_feedback_data = None
            feedback_context = calculate_daily_feedback(passenger_feedback_data, inspection_feedback_data)
            if not feedback_context:
                logging.exception(f"Error occurred while calculating feedback for date: {date}")
                return False
            
            feedback_total_daily = feedback_context['feedback_total_daily']
            # pdf Page 4 DAILY EVALUATION SHEET FOR DEDUCTION PURPOSE
            daily_buyers_eval_score = round(daily_buyers_eval * 0.8, 2)
            feedback_total_daily_score = round(feedback_total_daily * 0.2, 2)
            total_daily_eval = float("{:.2f}".format(
                round(daily_buyers_eval_score + feedback_total_daily_score, 2)))
            if not feedback_total_daily:
                total_daily_eval = daily_buyers_eval

            # Now we will use total_daily_eval to calculate the penalty
            accepted_daily_rate = station.station_penalty
            daily_penalty_applied = 0.0
            deduction_rate = None
            first_deduction = 0.0
            second_deduction = 0.0
            third_deduction = 0.0
            if accepted_daily_rate:
                rate_cal = calculate_penalty(accepted_daily_rate, total_daily_eval)
                if rate_cal:
                    daily_penalty_applied = rate_cal['penalty']
                    deduction_rate = rate_cal['deduction_rate']
                    first_deduction = rate_cal['first_deduction']
                    second_deduction = rate_cal['second_deduction']
                    third_deduction = rate_cal['third_deduction']
                else:
                    daily_penalty_applied = 0.0
                    deduction_rate = 0
            else:
                accepted_daily_rate = 0.0
                daily_penalty_applied = 0.0
                deduction_rate = 0

            env = os.getenv('ENV')
            is_prod = os.getenv('ENV') == 'prod'
            context = {
                'is_prod': is_prod,
                'env': env,
                'passenger_feedback_data': passenger_feedback_data,
                'inspection_feedback_data': inspection_feedback_data,
                'feedback_total_daily': feedback_total_daily,
                'feedback_total_daily_score': feedback_total_daily_score,
                'daily_buyers_eval_score': daily_buyers_eval_score,
                'total_daily_eval': total_daily_eval,
                'accepted_daily_rate': accepted_daily_rate,
                'daily_penalty_applied': daily_penalty_applied,
                'first_deduction': first_deduction,
                'second_deduction': second_deduction,
                'third_deduction': third_deduction,
                'deduction_rate': deduction_rate,
                'station_name': station.station_name,
                }
            context.update(buyers_sheet_context)
            context.update(feedback_context)
            return context
    
        except Exception as e:
            logging.exception(f"An error occurred while processing the DailyData in primary_stations: {repr(e)}")
            return False


    def bde_stations(self, request, station, date, is_images):
        try:
            today = datetime.datetime.today()
            formatted_date = date.strftime('%d-%m-%Y')
            all_tasks = Task.objects.filter(
                station=station
                ).prefetch_related('occurrences__ratings').order_by('task_id')
            shift = Shift.objects.filter(
                station=station).all().order_by('shift_id').last()
            update_rating_status(request.user.username, station, str(date))

            individual_ratings = []
            max_ratings = []
            ratings_sum = 0
            ratings_num_percentage = []
            images = []
            for task in all_tasks:
                task_images = []
                task_ratings = []
                max_ratings.append(4 * (task.occurrences.filter(rating_required=True).count()))
                for occurrence in task.occurrences.all():
                    if occurrence.rating_required:
                        if is_images:
                            task_images.append(occurrence.images.filter(date=date))
                        rating = occurrence.ratings.filter(date=date).last()
                        if rating is not None:
                            if rating.rating_value is not None:
                                task_ratings.append(rating.rating_value)
                                ratings_sum += int(rating.rating_value)
                            else:
                                task_ratings.append('X')
                        else:
                            task_ratings.append('X')
                    else:
                        task_ratings.append('NIL')
                ratings_num_percentage.append(100 / len(task_ratings))
                individual_ratings.append(task_ratings)
                images.append(task_images)
            tasks_list = zip(list(all_tasks), max_ratings, individual_ratings, ratings_num_percentage)
            total_max_ratings = sum(max_ratings)
            if total_max_ratings:
                avg_rating = round((ratings_sum * 100) / total_max_ratings, 2)
            else:
                avg_rating = 0
            
            percentage = avg_rating

            if shift.shift_id == 1:
                timing = f"{shift.start_time.strftime('%H:%M')} - {shift.end_time.strftime('%H:%M')} hrs."
            else:
                timing = None

            passenger_feedback_data = list(FeedbackAPI().get(
            request, station_code=station.station_code, date=date)) or []
            inspection_feedback_data = Inspection_feedback.objects.filter(
                date=date, 
                station=station
            ).prefetch_related('feedback_images').order_by('-created_at').first()

            # we need to neglect user feedbacks if there is any inspection feedback
            if inspection_feedback_data:
                passenger_feedback_data = None
            daily_feedback_context = calculate_daily_feedback(passenger_feedback_data, inspection_feedback_data)
            if not daily_feedback_context:
                logging.exception(f"Error occurred while calculating feedback for date: {date}")

            # calculate final daily score to be used in calculating deduction rate and penalty
            daily_buyers_eval_score = round(percentage * 0.8, 2)
            feedback_total_daily_score = round(daily_feedback_context.get('daily_per_total_score') * 0.2, 2)
            total_daily_eval = round(daily_buyers_eval_score + feedback_total_daily_score, 2)
            if not feedback_total_daily_score:
                total_daily_eval = percentage

            # calculate deduction rate and penalty
            accepted_daily_rate = 0.0
            daily_penalty_applied = 0.0
            deduction_rate = 0
            accepted_daily_rate = station.station_penalty
            if accepted_daily_rate:
                rate_cal = calculate_penalty(accepted_daily_rate, total_daily_eval)
                if rate_cal:
                    daily_penalty_applied = rate_cal['penalty']
                    deduction_rate = rate_cal['deduction_rate']

            # fetching verified shifts
            all_verified_shifts = Verified_shift.objects.filter(
                shift=shift, 
                verified_shift_date=date,
            )

            verified_shifts = []
            verified_shift_object1 =  all_verified_shifts.filter(
                verified_by__user_type__name__in=["supervisor", "chi_sm"]).last()
            verified_shift_object2 = all_verified_shifts.filter(
                verified_by__user_type__name="contractor").last()
            if verified_shift_object1:
                if verified_shift_object1.verification_status == True:
                    verified_shifts.append(verified_shift_object1)
            if verified_shift_object2:
                if verified_shift_object2.verification_status == True:
                    verified_shifts.append(verified_shift_object2)
            
            is_prod = os.getenv('ENV') == 'prod'
            context = {
                'is_prod': is_prod,
                'tasks': tasks_list,
                'avg_rating': avg_rating,
                'images': images,
                'total_max_ratings': total_max_ratings,
                'ratings_sum': ratings_sum,
                'station': station, 
                'timing': timing, 
                'date': today, 
                'formatted_date': formatted_date, 
                'percentage': percentage,
                'daily_buyers_eval': percentage,
                'daily_buyers_eval_score': daily_buyers_eval_score,
                'feedback_total_daily_score': feedback_total_daily_score,
                'total_daily_eval': total_daily_eval,
                'passenger_feedback_data': passenger_feedback_data,
                'inspection_feedback_data': inspection_feedback_data,
                "accepted_daily_rate": accepted_daily_rate,
                "daily_penalty_applied": daily_penalty_applied,
                "deduction_rate": deduction_rate,
                'verified_shifts' : verified_shifts,
                }

            context.update(daily_feedback_context)
            return context
        
        except Exception as e:
            logging.exception(f"An error occurred while processing the DailyData in bde_stations: {repr(e)}")
            return False


def calculate_monthly_data(request, date1):
    try:
        station = request.user.station
        date = datetime.datetime.strptime(date1, '%Y-%m-%d').date()
        formatted_date = date.strftime('%d-%m-%Y')

        all_shifts = Shift.objects.filter(
            station=station).all().order_by('shift_id')

        year = str(date.year)
        month = str(date.month)
        month_name = calendar.month_name[int(month)].capitalize()
        num_days = calendar.monthrange(int(year), int(month))
        now = datetime.datetime.now()

        start_date = datetime.date(date.year, date.month, 1)
        # Get the last day of the month
        if date.month == 12:
            end_date = datetime.date(date.year + 1, 1, 1) - datetime.timedelta(days=1)
        else:
            end_date = datetime.date(date.year, date.month + 1, 1) - datetime.timedelta(days=1)

        current_date = start_date
        weekly_avg_buyers_rating = []
        monthly_data = []
        seven_days_avg_buyers_score = []
        seven_days_data = []
        buyers_avg_rating_sum, feedback_avg_score_sum, total_daily_eval_sum = 0, 0, 0
        rating_each_day_arr = []
        weekly_feedback_count_data = []
        weekly_excellent_count, weekly_ok_count, weekly_poor_count = 0, 0, 0
        monthly_excellent_count, monthly_ok_count, monthly_poor_count = 0, 0, 0
        monthly_penalty_data = []
        first_deduction_sum, second_deduction_sum, third_deduction_sum = 0, 0, 0
        while current_date <= end_date:
            daily_data = {}
            daily_data_context = DailyData().primary_stations(request, current_date, False)
            if not daily_data_context:
                logging.exception(f"Error occurred while generating daily buyers data for date: {current_date}")
                return False

            pdf_date = current_date.strftime('%d-%m-%Y')

            weekly_excellent_count += daily_data_context.get('excellent_count')
            weekly_ok_count += daily_data_context.get('ok_count')
            weekly_poor_count += daily_data_context.get('poor_count')
            monthly_excellent_count += daily_data_context.get('excellent_count')
            monthly_ok_count += daily_data_context.get('ok_count')
            monthly_poor_count += daily_data_context.get('poor_count')

            daily_buyers_avg_rating = daily_data_context.get('percentage', 0)
            daily_feedback_total_avg = daily_data_context.get('feedback_total_daily', 0)
            buyers_avg_rating_sum += daily_buyers_avg_rating
            feedback_avg_score_sum += daily_feedback_total_avg
            
            daily_data['date'] = pdf_date
            daily_data['daily_buyers_avg_rating'] = daily_buyers_avg_rating
            daily_data['weekly_avg_rating'] = None

            seven_days_avg_buyers_score.append(daily_buyers_avg_rating)
            seven_days_data.append(daily_data)
            if len(seven_days_avg_buyers_score) == 7:
                weekly_avg_feedback_score = 0
                weekly_total_feedbacks = weekly_excellent_count + weekly_ok_count + weekly_poor_count
                weekly_ok_avg_score = weekly_ok_count * 0.9 
                total_weekly_avg_score = weekly_excellent_count + weekly_ok_avg_score + 0 
                if weekly_total_feedbacks:
                    weekly_avg_feedback_score = round((total_weekly_avg_score * 100) / weekly_total_feedbacks)
                weekly_feedback_data = {
                    'excellent_count': weekly_excellent_count if weekly_excellent_count else 'N/A',
                    'ok_count': weekly_ok_count if weekly_ok_count else 'N/A',
                    'poor_count': weekly_poor_count if weekly_poor_count else 'N/A',
                    'avg_ok': weekly_ok_avg_score if weekly_ok_avg_score else 'N/A',
                    'total_avg': total_weekly_avg_score if total_weekly_avg_score else 'N/A',
                    'total_feedbacks': weekly_total_feedbacks  if weekly_total_feedbacks else 'N/A',
                    'avg_feedback': weekly_avg_feedback_score if total_weekly_avg_score else 'N/A'
                }
                weekly_feedback_count_data.append(weekly_feedback_data)
                weekly_excellent_count, weekly_ok_count, weekly_poor_count = 0, 0, 0

                weekly_avg_rating = round(sum(seven_days_avg_buyers_score) / 7, 2) or 'N/A'
                seven_days_data[0]['weekly_avg_rating'] = weekly_avg_rating
                weekly_avg_buyers_rating.append(weekly_avg_rating)
                seven_days_data = []
                seven_days_avg_buyers_score = []

            daily_penalty_data = {
                'date': pdf_date, 
                'first_deduction': daily_data_context.get('first_deduction', 0.0),
                'second_deduction': daily_data_context.get('second_deduction', 0.0),
                'third_deduction': daily_data_context.get('third_deduction', 0.0)
            }
            first_deduction_sum += daily_penalty_data.get('first_deduction', 0.0)
            second_deduction_sum += daily_penalty_data.get('second_deduction', 0.0)
            third_deduction_sum += daily_penalty_data.get('third_deduction', 0.0)

            monthly_data.append(daily_data)
            monthly_penalty_data.append(daily_penalty_data)
            current_date += datetime.timedelta(days=1)

        monthly_total_feedbacks = monthly_excellent_count + monthly_ok_count + monthly_poor_count
        monthly_ok_avg_score = monthly_ok_count * 0.9
        monthly_total_feedback_score = monthly_excellent_count + monthly_ok_avg_score + 0
        if monthly_total_feedbacks:
            monthly_avg_feedback_score = round((monthly_total_feedback_score * 100) / monthly_total_feedbacks)
        else:
            monthly_avg_feedback_score = 0

        avg_total_daily_eval = round(total_daily_eval_sum / num_days[1], 2)
        monthly_avg_rating_score = round(buyers_avg_rating_sum / num_days[1], 2)
        final_buyers_score = round(0.8 * monthly_avg_rating_score, 2)
        final_feedback_score = round(0.2 * monthly_avg_feedback_score, 2)
        final_buyers_feedback_sum = round(final_buyers_score + final_feedback_score, 2)
        if not monthly_avg_feedback_score:
            final_buyers_feedback_sum = monthly_avg_rating_score

        weekly_performance_data = []
        for i in range(0, 4):
            week_data = {}
            if isinstance(weekly_avg_buyers_rating[i], (int, float)):
                week_data['rating'] = round(0.8 * weekly_avg_buyers_rating[i], 2) or 'N/A'
            else:
                week_data['rating'] = 'N/A'
            if isinstance(weekly_feedback_count_data[i]['avg_feedback'], (int, float)):
                week_data['feedback'] = round(0.2 * weekly_feedback_count_data[i]['avg_feedback'], 2) or 'N/A'
            else:
                week_data['feedback'] = 'N/A'
            if week_data['rating'] != 'N/A' and week_data['feedback'] != 'N/A':
                week_data['total'] = round(week_data['rating'] + week_data['feedback'], 2) or 'N/A'
            else:
                week_data['total'] = 'N/A'
            if week_data['rating'] in ['N/A', 0]:
                week_data['total'] = week_data['feedback']
            elif week_data['feedback'] in ['N/A', 0]:
                week_data['total'] = weekly_avg_buyers_rating[i]
            weekly_performance_data.append(week_data)

        total_deduction_sum = round((first_deduction_sum + second_deduction_sum + third_deduction_sum), 2)

        monthly_context = {
            'station': station,
            'start_date': start_date,
            'end_date': end_date,
            'current_date': formatted_date,
            'now': now,
            'monthly_data': monthly_data,
            'month_name': month_name,
            'avg_total_daily_eval': avg_total_daily_eval,
            'weekly_performance_data': weekly_performance_data,
            'weekly_avg_buyers_rating': weekly_avg_buyers_rating,
            'final_feedback_score': final_feedback_score,
            'final_buyers_score': final_buyers_score,
            'final_buyers_feedback_sum': final_buyers_feedback_sum,
            'weekly_feedback_counts': weekly_feedback_count_data,
            'monthly_avg_rating': monthly_avg_rating_score,
            'monthly_excellent_count': monthly_excellent_count,
            'monthly_ok_count': monthly_ok_count,
            'monthly_poor_count': monthly_poor_count,
            'monthly_ok_avg': monthly_ok_avg_score,
            'monthly_total_feedbacks': monthly_total_feedbacks,
            'monthly_total_feedback_score': monthly_total_feedback_score,
            'monthly_avg_feedback_score': monthly_avg_feedback_score,
            'monthly_penalty_data': monthly_penalty_data,
            'first_deduction_sum': round(first_deduction_sum, 2),
            'second_deduction_sum': round(second_deduction_sum, 2),
            'third_deduction_sum': round(third_deduction_sum, 2),
            'total_deduction_sum': round(total_deduction_sum, 2),
        }

        # third page content
        inspection_feedback_arr_remarks = []
        inspection_feedback_arr_rating = []
        for i in range(1, num_days[1]+1):
            date_iter = year+"-"+month+"-"+str(i)
            try:
                inspection_feedback = Inspection_feedback.objects.get(
                    station=station, date=date_iter)
                inspection_feedback_arr_remarks.append(
                    inspection_feedback.remarks)
                inspection_feedback_arr_rating.append(
                    inspection_feedback.rating)
            except Inspection_feedback.DoesNotExist:
                inspection_feedback_arr_remarks.append("N/A")
                inspection_feedback_arr_rating.append("N/A")

        env = os.getenv('ENV')
        context = {
            'env': env,
            'shift': list(all_shifts),
            'date': date, 'formatted_date': formatted_date, 'station': station, 'year': year, 'month': month, 'num_days': num_days[1], 'inspection_feedback_arr_remarks': inspection_feedback_arr_remarks, 'inspection_feedback_arr_rating': inspection_feedback_arr_rating, 'rating_each_day_arr': rating_each_day_arr,
        }
        context.update(monthly_context)
        linux_environment = platform.system() == 'Linux'
        context['linux_environment'] = linux_environment

        return context

    except Exception as e:
        logging.exception(f"An error occurred while calculating the monthly data in calculate_monthly_data: {repr(e)}")
        return False


def html_to_pdf(template, context={}, filename="output.pdf"):
    template = get_template(template)
    html  = template.render(context)
    result = BytesIO()
    pdf = pisa.pisaDocument(BytesIO(html.encode("UTF-8")), result)
    if not pdf.err:
        file_path = os.path.join(settings.MEDIA_ROOT, 'pdf_files', filename)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'wb') as f:
            f.write(result.getvalue())
        return file_path
    return None


# For looping page 1 and images
class MyDate:
    def __init__(self, year, month, day):
        self.year = year
        self.month = month
        self.day = day

    def __repr__(self):
        return f"{self.year}-{self.month}-{self.day}"

    def strftime(self, format):
        if format == '%d-%m-%Y':
            return f'{self.day:02d}-{self.month:02d}-{self.year}'
        else:
            return f'{self.year}-{self.month:02d}-{self.day:02d}'


# To compress pdf file
def compress_pdf(input_path, output_path):
    input_file_size = os.path.getsize(input_path)
    try:
        # Open the PDF
        pdf_document = fitz.open(input_path)
        
        # Save the PDF with compression
        pdf_document.save(output_path, deflate=True)  # `deflate=True` applies compression
        pdf_document.close()
        
    except Exception as e:
        logging.exception(f"An error occurred while file compressing: {repr(e)}")
        return False
    
    output_file_size = os.path.getsize(output_path)
    return input_file_size, output_file_size


def upload_file_to_drive(filename, file_path, SERVICE_ACCOUNT_KEY, FOLDER_ID):
    try:
        credentials = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_KEY, scopes=['https://www.googleapis.com/auth/drive'])
        service = build('drive', 'v3', credentials=credentials)

        # #--To get the shared folders--

        # results = service.files().list(q="mimeType='application/vnd.google-apps.folder' and trashed = false and sharedWithMe",fields="nextPageToken, files(id, name)").execute()
        # items = results.get('files', [])

        # if not items:
        #     print('No shared folders found.')
        # else:
        #     print('Shared folders:')
        #     for item in items:
        #         print(f'{item["name"]} ({item["id"]})')

        logging.info("Service built")
        file_metadata = {
            'name': filename,
            'parents': [FOLDER_ID]
        }

        logging.info("File metadata created")
        media = MediaFileUpload(file_path, resumable=True)
        logging.info("Media file created")
        file = service.files().create(
            body=file_metadata, media_body=media, fields='id').execute()
        logging.info("File created")
        logging.info(f'File ID: {file.get("id")}')
        public_url = f'https://drive.google.com/uc?id={file.get("id")}'
        logging.info(f'Public URL: {public_url}')

        return public_url
    
    except HttpError as e:
        logging.exception(f"An HttpError error occurred while uploading file to drive: {repr(e)}")
        return None

    except Exception as e:
        logging.exception(f"An error occurred while uploading file to drive: {repr(e)}")
        return None


def send_pdf(subject, message, from_, to):
    try:
        email = EmailMessage(subject, message, from_, to)
        # email.attach_file(file_path)
        email.send()
        logging.info(f'Mail sent to {to}')
        # os.remove(file_path)
        return True

    except Exception as e:
        logging.exception(f"An error occurred in send_pdf while mailing the pdf: {repr(e)}")
        return False


def calculate_penalty(accepted_daily_rate, total_daily_eval):
    rate = {}
    try:
        if 75 <= total_daily_eval <= 85:
            penalty = round(0.05 * accepted_daily_rate, 2)
            rate['deduction_rate'] = 5
            rate['penalty'] = penalty
            rate['first_deduction'] = penalty
            rate['second_deduction'] = 0.0
            rate['third_deduction'] = 0.0
        elif 65 <= total_daily_eval < 75:
            penalty = round(0.07 * accepted_daily_rate, 2)
            rate['deduction_rate'] = 7
            rate['penalty'] = penalty
            rate['second_deduction'] = penalty
            rate['first_deduction'] = 0.0
            rate['third_deduction'] = 0.0
        elif total_daily_eval < 65:
            penalty = round(0.10 * accepted_daily_rate, 2)
            rate['deduction_rate'] = 10
            rate['penalty'] = penalty
            rate['third_deduction'] = penalty
            rate['first_deduction'] = 0.0
            rate['second_deduction'] = 0.0
        else:
            rate['deduction_rate'] = 5
            rate['penalty'] = 0.0
            rate['first_deduction'] = 0.0
            rate['second_deduction'] = 0.0
            rate['third_deduction'] = 0.0
        return rate
    
    except Exception as e:
        logging.exception(f"An error occurred while calculating penalty: {repr(e)}")
        return None
