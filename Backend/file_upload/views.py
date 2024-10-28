import logging
from django.http import JsonResponse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import permission_classes, api_view
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ObjectDoesNotExist
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
import datetime

from .models import Media
from .serializers import MediaSerializer, NotifiedMediaSerializer
from .utils import format_image
from shift.models import Shift
from task.models import Task
from task_shift_occurrence.models import TaskShiftOccurrence
from website.utils import check_permission
from website.decorators import allowed_users
from notified_data.models import notified_data


@permission_classes([IsAuthenticated])
@method_decorator(ratelimit(key='ip', rate='50/m', block=True), name='dispatch')
class MediaAPIView(APIView):
    def get(self, request, task_id=None, shift_id=None, occurrence_id=None, format=None):
        try:
            user = request.user
            station = user.station
            shift = Shift.objects.get(shift_id=shift_id, station=station)
            task = Task.objects.get(task_id=task_id, station=station)
            task_shift_occur = TaskShiftOccurrence.objects.get(
                shift=shift, task=task, occurrence_id=occurrence_id)
            date = request.GET['date']
            media = Media.objects.filter(
                task_shift_occur_id=task_shift_occur.id, date=date)
            serializer = MediaSerializer(media, many=True)

            return Response(serializer.data, status=status.HTTP_200_OK)

        except ObjectDoesNotExist:
            return Response({"message": "Media not found"}, status=status.HTTP_404_NOT_FOUND)
        
        except KeyError as e:
            return Response({"message": f"Missing data: {e.args[0]}"})

        except Exception as e:
            logging.exception(f"An error occurred while retrieving media: {repr(e)}")
            message = {"message": "Error occurred while retrieving media"}
            return Response(message, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def post(self, request, task_id=None, shift_id=None, occurrence_id=None, format=None):
        try:
            user = request.user
            station = user.station
            try:
                shift = Shift.objects.get(shift_id=shift_id, station=station)
                task = Task.objects.get(task_id=task_id, station=station)
                task_shift_occur = TaskShiftOccurrence.objects.get(
                    shift=shift, task=task, occurrence_id=occurrence_id)
            except ObjectDoesNotExist as e:
                return Response({"message": f"Object not found: {repr(e)}"}, status=status.HTTP_404_NOT_FOUND)
            check = check_permission(user)
            role = user.user_type
            sup = role.name
            if not check or sup not in ['supervisor', 'railway admin', 'officer', 'contractor', 'chi_sm']:
                return Response("Permission Denied", status=status.HTTP_403_FORBIDDEN)
            
            data = request.data
            if shift.shift_id == 1:
                curr_shift = 'morning'
            elif shift.shift_id == 2:
                curr_shift = 'afternoon'
            elif shift.shift_id == 3:
                curr_shift = 'night'
            else:
                curr_shift = '_'
            uploaded_files_new = []
            for key in request.FILES:
                uploaded_files_new += request.FILES.getlist(key)
            for myfile in uploaded_files_new:
                fileformat = myfile.name.split('.')[-1]
                created_at = datetime.datetime.today()
                int_speed = 1024
                if int_speed <= 0.2:
                    full_file_name = f"{user.username}_{task.task_id}_{curr_shift}_{occurrence_id}_{user.station.station_name}_{created_at}_lq.{fileformat}"
                    image_format = 'PNG'
                    quality = 40
                else:
                    full_file_name = f"{user.username}_{task.task_id}_{curr_shift}_{occurrence_id}_{user.station.station_name}_{created_at}_hq.{fileformat}"
                    image_format = 'JPEG'
                    quality = 80
            
                new_file  = format_image(myfile, full_file_name, image_format, quality)
                if not new_file:
                    return Response({"message": f"An error occurred while proccessing the image: {myfile}"}, status=status.HTTP_400_BAD_REQUEST)
                try:
                    data.update({
                        'latitude': data['latitude'],
                        'longitude': data['longitude'],
                        'image': new_file,
                        'date': data['date'],
                        'task_shift_occur_id': task_shift_occur.id,
                        'user': user.id,
                        'created_by': user.username,
                        'updated_by': user.username
                    })

                except KeyError as e:
                    return Response({"message": f"Data missing: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)
                
                serializer = MediaSerializer(data=data)
                if serializer.is_valid(raise_exception=True):
                    serializer.save()      
                    response_data = {"message": "Images are uploaded successfully"}
                    response_data.update(serializer.data)
                    return Response(response_data, status=status.HTTP_201_CREATED)
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                    
        except Exception as e:
            message = 'An error occurred while uploading images'
            logging.exception(f"{message} in MediaAPIView: {repr(e)}")
            return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def put(self, request, img_id=None, format=None):
        try:
            data = request.data.copy()
            try:
                image = Media.objects.get(id=img_id)
            except Media.DoesNotExist:
                return Response({"message": "Media not found"}, status=status.HTTP_404_NOT_FOUND)
            
            user = request.user
            check = check_permission(user)
            role = user.user_type
            sup = role.name
            data['updated_by'] = user.username

            if check and sup in ["supervisor", "officer", 'railway admin']:
                serializer = MediaSerializer(image, data=data, partial=True)
                if serializer.is_valid(raise_exception=True):
                    serializer.save()
                    response_data = {"message": 'Image updated'}
                    response_data.update(serializer.data)
                    return Response(response_data, status=status.HTTP_200_OK)
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({'message': 'Permission Denied'}, status=status.HTTP_403_FORBIDDEN)
            
        except Exception as e:
            logging.exception(f"An error occurred in MediaAPIView: {repr(e)}")
            return Response({"message": "An error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def delete(self, request, img_id):
        try:
            user = request.user
            check = check_permission(user) 
            sup = user.user_type.name
            user_station = user.station.station_name

            if check and sup in ["supervisor", "officer", 'railway admin', 'chi_sm', 'contractor']:
                try:
                    media = Media.objects.get(id=img_id)
                    if ((media.user != user) and (sup not in ['railway admin', 'chi_sm','officer'])):
                        return Response({'message': 'Permission Denied'}, status=status.HTTP_403_FORBIDDEN)
                    media.delete()
                    logging.info(f"Media deleted by {user.username} from {user_station}")
                    return Response({'message': 'Media deleted'}, status=status.HTTP_200_OK)
                except Media.DoesNotExist:
                    return Response({'message': 'Media does not exist'}, status=status.HTTP_404_NOT_FOUND)
            else:
                return Response({'message': 'Permission Denied'}, status=status.HTTP_403_FORBIDDEN)
            
        except Exception as e:
            logging.exception(f"An error occurred while deleting Media: {repr(e)}")
            return Response({"message": "An error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@permission_classes([IsAuthenticated])
@method_decorator(ratelimit(key='ip', rate='50/m', block=True), name='dispatch')
class CheckImageExistsAPIView(APIView):
    def post(self, request):
        try:
            if 'myfile' in request.FILES:
                myfile = request.FILES['myfile']
                file_name = myfile.name.split('.')[0]
                file_name = file_name.replace(' ', '_')
                file_name = file_name.replace('(', '')
                file_name = file_name.replace(')', '')

                try:
                    all_media_objects = Media.objects.all()
                    for media_obj in all_media_objects[::-1]:
                        if file_name in media_obj.image.name:
                            # If the filename exists in any of the media object image names, return the result
                            response_data = {'exists': True,
                                            'img_id': media_obj.id}
                            return Response(response_data, status=status.HTTP_200_OK)

                    # If the filename does not exist in any of the media object image names, return the result
                    return Response({'exists': False}, status=status.HTTP_404_NOT_FOUND)

                except Exception as e:
                    response_data = {'exists': False}
                    logging.exception(f"An error occurred while checking the media: {repr(e)}")
                    return Response(response_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            else:
                return Response({'message': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logging.exception(f"An error occurred in CheckImageExistsAPIView: {repr(e)}")
            return Response({"message": "An error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
@allowed_users(['supervisor', 'contractor', 'railway admin', 'officer', 'chi_sm'])
def view_media(request, img_id, task_id, shift_id, occur_id, prev_page):
    try:
        try:
            media = Media.objects.get(id=img_id)
        except Media.DoesNotExist:
            return Response({"message": "Media does not exist"}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = MediaSerializer(media)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logging.exception(f"An error occurred in view_media: {repr(e)}")
        return Response({"message": "An error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@permission_classes([IsAuthenticated])
@method_decorator(ratelimit(key='ip', rate='50/m', block=True), name='dispatch')
class NotifiedDataMediaAPIView(APIView):
    def get(self, request, complaint_id, format=None):
        try:
            user = request.user
            station = user.station
            media = Media.objects.filter(feedback_complaint=complaint_id)
            serializer = NotifiedMediaSerializer(media, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except ObjectDoesNotExist:
            return Response({"message": "Media not found"}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            message = "Error occurred while retrieving media"
            logging.exception(f"{message} in NotifiedDataMediaAPIView: {repr(e)}")
            return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def put(self, request, img_id=None, format=None):
        try:
            data = request.data.copy()
            try:
                image = Media.objects.get(id=img_id)
            except Media.DoesNotExist:
                return Response({"message": "Media not found"}, status=status.HTTP_404_NOT_FOUND)
            
            user = request.user
            check = check_permission(user)
            role = user.user_type
            sup = role.name
            data['updated_by'] = user.username

            if check and sup in ['railway manager', 'railway admin', 'chi_sm']:
                serializer = NotifiedMediaSerializer(image, data=data, partial=True)
                if serializer.is_valid(raise_exception=True):
                    serializer.save()
                    response_data = {"message": 'Image updated'}
                    response_data.update(serializer.data)
                    return Response(response_data, status=status.HTTP_200_OK)
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({'message': 'Permission Denied'}, status=status.HTTP_403_FORBIDDEN)
            
        except Exception as e:
            logging.exception(f"An error occurred in MediaAPIView: {repr(e)}")
            return Response({"message": "An error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def delete(self, request, img_id):
        try:
            user = request.user
            check = check_permission(user) 
            sup = user.user_type.name
            if check and sup in ['railway manager', 'railway admin', 'chi_sm']:
                try:
                    media = Media.objects.get(id=img_id)
                    if media.user == user:
                        media.delete()
                        return Response({'message': 'Media deleted'}, status=status.HTTP_200_OK)
                    else:
                        return Response({'message': 'You do not have the permission to delete this image'}, status=status.HTTP_403_FORBIDDEN)
                except Media.DoesNotExist:
                    return Response({'message': 'Media not found'}, status=status.HTTP_404_NOT_FOUND)
            else:
                return Response({'message': 'Permission Denied'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logging.exception(f"An error occurred while deleting Media: {repr(e)}")
            return Response({"message": "An error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# @ratelimit(key='ip', rate='50/m', block=True)
# @allowed_users(['supervisor', 'contractor', 'railway admin', 'officer'])
# def view_media(request, img_id, task_id, shift_id, occur_id, prev_page):
#     id = img_id
#     station = request.user.station
#     media = Media.objects.get(id=id)
#     img_task_shift_occur = media.task_shift_occur_id
#     date = media.date
#     previous_images = []
#     next_images = []
#     current_image = 0
#     for each_img in Media.objects.filter(task_shift_occur_id=img_task_shift_occur, date=date).all():
#         if img_id == each_img.id:
#             current_image = 1

#         else:
#             if current_image == 0:
#                 previous_images.append(each_img.id)
#             if current_image == 1:
#                 next_images.append(each_img.id)

#     if len(previous_images) > 0:
#         previous_image_id = previous_images[-1]
#     else:
#         previous_image_id = 0

#     if len(next_images) > 0:
#         next_image_id = next_images[0]
#     else:
#         next_image_id = 0

#     # print(task_id)
#     # print(shift_id)
#     # print(occur_id)

#     shift_count = TaskShiftOccurrence.objects.filter(
#         task__id=task_id, shift__id=shift_id).count()
#     if occur_id + 1 <= shift_count:
#         next_occurrence = occur_id + 1
#         next_occurrence_obj = TaskShiftOccurrence.objects.filter(
#             task__id=task_id, shift__id=shift_id, occurrence_id=next_occurrence).first()
#     else:
#         next_occurrence = None

#     if next_occurrence:
#         next_occur_media = Media.objects.filter(
#             task_shift_occur_id=next_occurrence_obj, date=date).first()
#         if next_occur_media:
#             next_occur_img = next_occur_media.id
#         else:
#             next_occur_img = None
#     else:
#         next_occur_img = None

#     if occur_id > 1:
#         prev_occurrence = occur_id - 1
#         prev_occurrence_obj = TaskShiftOccurrence.objects.filter(
#             task__id=task_id, shift__id=shift_id, occurrence_id=prev_occurrence).first()
#         prev_occur_media = Media.objects.filter(
#             task_shift_occur_id=prev_occurrence_obj, date=date).first()
#         if prev_occur_media:
#             prev_occur_img = prev_occur_media.id
#         else:
#             prev_occur_img = None
#     else:
#         prev_occurrence = None
#         prev_occur_img = None

#     next_shift = Shift.objects.filter(station=station, id=shift_id + 1).first()
#     if next_shift:
#         next_shift = next_shift.id
#         next_shift_occur = TaskShiftOccurrence.objects.filter(
#             task__id=task_id, shift__id=next_shift).first().id
#         next_shift_media = Media.objects.filter(
#             task_shift_occur_id=next_shift_occur, date=date).first()
#         if next_shift_media:
#             next_shift_img = next_shift_media.id
#         else:
#             next_shift_img = None
#     else:
#         next_shift_img = None

#     if (shift_id > 1):
#         prev_shift = Shift.objects.filter(
#             station=station, id=shift_id - 1).first()
#         if prev_shift:
#             prev_shift = prev_shift.id
#             prev_shift_occur = TaskShiftOccurrence.objects.filter(
#                 task__id=task_id, shift__id=prev_shift).first().id
#             prev_shift_media = Media.objects.filter(
#                 task_shift_occur_id=prev_shift_occur, date=date).first()
#             if prev_shift_media:
#                 prev_shift_img = prev_shift_media.id
#             else:
#                 prev_shift_img = None
#         else:
#             prev_shift_img = None
#     else:
#         prev_shift = None
#         prev_shift_img = None

#     task_count = Task.objects.filter(station=station).count()
#     current_task = Task.objects.filter(station=station, id=task_id).first()
#     current_task_num = current_task.task_id
#     # print(task_count, current_task_num)

#     next_task_img = None
#     next_task = None
#     for i in range(1, task_count-current_task_num+1):
#         next_task = Task.objects.filter(
#             station=station, id=task_id + i).first()
#         if next_task:
#             next_task = next_task.id
#             next_task_occur = TaskShiftOccurrence.objects.filter(
#                 task__id=next_task, shift__id=shift_id).first()
#             if next_task_occur:
#                 next_task_occur = next_task_occur.id
#                 next_task_media = Media.objects.filter(
#                     task_shift_occur_id=next_task_occur, date=date).first()
#                 if next_task_media:
#                     next_task_img = next_task_media.id
#                     break
#                 else:
#                     next_task_img = None
#             else:
#                 next_task_img = None

#     current_task_task_id = current_task.task_id
#     prev_task = None
#     prev_task_img = None
#     if (task_id > 1):
#         for i in range(1, current_task_task_id):
#             prev_task = Task.objects.filter(
#                 station=station, id=task_id - i).first()
#             if prev_task:
#                 prev_task = prev_task.id
#                 prev_task_occur = TaskShiftOccurrence.objects.filter(
#                     task__id=prev_task, shift__id=shift_id).first()
#                 if prev_task_occur:
#                     prev_task_occur = prev_task_occur.id
#                     prev_task_media = Media.objects.filter(
#                         task_shift_occur_id=prev_task_occur, date=date).first()
#                     if prev_task_media:
#                         prev_task_img = prev_task_media.id
#                         break
#                     else:
#                         prev_task_img = None
#                 else:
#                     prev_task_img = None

#     if prev_page == 'currShift':
#         next_shift = None
#         next_shift_img = None
#         prev_shift = None
#         prev_shift_img = None

#     if media:
#         # Extract data from the media
#         latitude = media.latitude
#         longitude = media.longitude
#         date = media.created_at
#         updated = media.updated_by

#         context = {
#             'url': media.image.url,
#             'media': media,
#             'latitude': latitude,
#             'longitude': longitude,
#             'date': date,
#             'updated': updated,
#             'previous_image_id': previous_image_id,
#             'next_image_id': next_image_id,
#             'task_id': task_id,
#             'shift_id': shift_id,
#             'occurence_id': occur_id,
#             'next_occurrence': next_occurrence,
#             'next_occur_img': next_occur_img,
#             'prev_occurrence': prev_occurrence,
#             'prev_occur_img': prev_occur_img,
#             'next_shift': next_shift,
#             'next_shift_img': next_shift_img,
#             'prev_shift': prev_shift,
#             'prev_shift_img': prev_shift_img,
#             'next_task': next_task,
#             'next_task_img': next_task_img,
#             'prev_task': prev_task,
#             'prev_task_img': prev_task_img,
#             'prev_page': prev_page,
#         }
#         return Response(context, status=status.HTTP_200_OK)

#     else:
#         return Response({"message": "Permission Denied"}, status=status.HTTP_400_BAD_REQUEST)
