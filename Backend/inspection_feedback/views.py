import logging
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.decorators import permission_classes, api_view
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from django.core import serializers
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import authentication_classes, permission_classes
from rest_framework.generics import RetrieveUpdateDestroyAPIView,ListAPIView
from django.shortcuts import get_object_or_404

from .models import Inspection_feedback,Image
from .serializers import InspectionFeedbackSerializer,ImageSerializer
from .utils import upload_inspection_feedback_images
from website.utils import check_permission
from website.decorators import allowed_users
from website.permissions import IsRailwayAdmin


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
@allowed_users(['supervisor', 'contractor', 'railway admin', 'officer', "chi_sm"])
def inspection_feedback(request):
    try:
        user = request.user
        station = user.station
        station_json = serializers.serialize('json', [station])
        role = user.user_type
        sup = role.name

        if check_permission(user):
            context = {
                'sup': sup, 
                'station': station_json
            }
            return Response(context, status=status.HTTP_200_OK)
        else:
            messages = f"{sup} don't have permission to do this task"
            return Response({'message': messages}, status=status.HTTP_403_FORBIDDEN)
        
    except Exception as e:
        message = 'An error occurred while loading the Inspection Feedback page'
        logging.exception(f"{message} in inspection_feedback: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@permission_classes([IsAuthenticated])
@method_decorator(ratelimit(key='ip', rate='50/m', block=True), name='dispatch')
class InspectionFeedbackApi(APIView):
    def post(self, request):
        try:
            data = request.data.copy()
            user = request.user
            station = user.station
            role = user.user_type
            sup = role.name

            if check_permission(user) and sup in ["supervisor", "contractor", "railway admin", "officer", "chi_sm"]:
                try:
                    existing_feedback = Inspection_feedback.objects.get(station=station, date=data['date'])
                    if existing_feedback.user == user and existing_feedback.status == 'Pending':
                        data.update({'updated_by': user.username})
                        serializer = InspectionFeedbackSerializer(
                            instance=existing_feedback,
                            data=data,
                            partial=True
                        )
                        response_data = {'message': 'Inspection Feedback is updated'}
                    else:
                        raise PermissionDenied("You don't have permission to update this feedback.")
                    
                except Inspection_feedback.DoesNotExist:
                    data.update(
                        {
                            'created_by': user.username,
                            'updated_by': user.username,
                            'user': user.id,
                            'station': station.id,
                            }
                    )

                    serializer = InspectionFeedbackSerializer(data=data)
                    response_data = {'message': 'Inspection Feedback is created'}

                except Inspection_feedback.MultipleObjectsReturned:
                    return Response({"message": "Multiple feedbacks found for the particular date"}, status=status.HTTP_400_BAD_REQUEST)

                if serializer.is_valid(raise_exception=True):
                    serializer.save()
                    if 'status' in data:
                        serializer.validated_data['status'] = data['status']
                        serializer.save()
                        
                    if 'images' in request.FILES:
                        result = upload_inspection_feedback_images(request, serializer.instance)

                        if isinstance(result, Response):
                            return result
                    
                    serializer.save()
                    response_data.update(serializer.data)
                    
                    return Response(
                        response_data, 
                        status=status.HTTP_201_CREATED 
                        if 'created' in response_data['message'] else status.HTTP_200_OK
                        )
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({'message': 'Permission Denied'}, status=status.HTTP_403_FORBIDDEN)

        except KeyError as e:
            return Response({"message": f"Data missing: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)

        except ValidationError as e:
            return Response({"message": repr(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        except PermissionDenied as e:
            return Response({"message": str(e)}, status=status.HTTP_403_FORBIDDEN)

        except Exception as e:
            message = 'An error occurred while creating an Inspection Feedback'
            logging.exception(f"{message} in InspectionFeedbackApi: {repr(e)}")
            return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        
@permission_classes([IsAuthenticated, IsRailwayAdmin])
class UpdateFeedbackStatusApi(APIView):
    def put(self, request, pk):
        try:
            feedback = Inspection_feedback.objects.get(pk=pk)
            if feedback.status == 'Completed':
                feedback.status = 'Pending'
                feedback.save()
                return Response({'message': 'Feedback status updated to Pending'}, status=status.HTTP_200_OK)
            else:
                raise PermissionDenied("You don't have permission to update the status.") 

        except Inspection_feedback.DoesNotExist:
            return Response({"message": "Feedback not found"}, status=status.HTTP_404_NOT_FOUND)

        except PermissionDenied as e:
            return Response({"message": str(e)}, status=status.HTTP_403_FORBIDDEN)

        except Exception as e:
            message = 'An error occurred while updating feedback status'
            logging.exception(f"{message} in UpdateFeedbackStatusApi: {repr(e)}")
            return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ListRetrieveUpdateDeleteFeedbackApi(RetrieveUpdateDestroyAPIView):
    queryset = Inspection_feedback.objects.all()
    serializer_class = InspectionFeedbackSerializer
    permission_classes = [IsAuthenticated]


    def get_object(self):
        pk = self.kwargs.get('pk')
        return get_object_or_404(Inspection_feedback, pk=pk)

    def perform_update(self, serializer):
        try:
            user = self.request.user
            station = user.station
            role = user.user_type
            sup = role.name

            feedback_instance = serializer.instance

            # Check if the user is the owner of the feedback and has the necessary role to update
            if (
                feedback_instance.user == user
                and feedback_instance.status == 'Pending'
                and sup in ["supervisor", "contractor", "railway admin", "officer", "chi_sm"]
            ):
                if 'status' in self.request.data:
                    serializer.validated_data['status'] = self.request.data['status']
                
                serializer.save(updated_by=user.username)

                # Check if additional images are present in the request
                if 'images' in self.request.FILES:
                    result = upload_inspection_feedback_images(self.request, feedback_instance)
                    if isinstance(result, Response):
                        raise result  # Re-raise the response if there's an error during image upload

            else:
                raise PermissionDenied("You don't have permission to update this feedback.")

        except PermissionDenied as e:
            logging.exception(f"PermissionDenied in perform_update: {repr(e)}")
            raise e
        except Exception as e:
            logging.exception(f"An error occurred in perform_update: {repr(e)}")
            raise e

    def perform_destroy(self, instance):
        try:
            user = self.request.user
            feedback = self.get_object()

            if feedback.user == user:
                instance.delete()
            else:
                raise PermissionDenied("You don't have permission to delete this feedback.")

        except PermissionDenied as e:
            logging.exception(f"PermissionDenied in perform_destroy: {repr(e)}")
            raise e
        except Exception as e:
            logging.exception(f"An error occurred in perform_destroy: {repr(e)}")
            raise e
        
        
class ListFeedbacksByDateApi(ListAPIView):
    serializer_class = InspectionFeedbackSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        try:
            user = self.request.user
            station = user.station
            date_param = self.request.query_params.get('date', None)
            if not date_param:
                return []
            return Inspection_feedback.objects.filter(station=station, date=date_param)
            
        except Exception as e:
            logging.exception(f"An error occurred in ListFeedbacksByDateApi: {repr(e)}")
            return Response({"message": "An error occurred while listing feedback"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@allowed_users(['supervisor', 'contractor', 'railway admin', 'officer', 'chi_sm'])
def get_inspection_feedback_images(request, feedback_id):
    try:
        feedback_instance = get_object_or_404(Inspection_feedback, id=feedback_id)
        images = feedback_instance.feedback_images.all()
        serializer = ImageSerializer(images, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        message = f'An error occurred while fetching images for Inspection Feedback {feedback_id}'
        logging.exception(f"{message}: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
@allowed_users(['supervisor', 'contractor', 'railway admin', 'officer', 'chi_sm'])
def delete_inspection_feedback_image_api(request, feedback_id, image_id):
    try:
        feedback_instance = get_object_or_404(Inspection_feedback, id=feedback_id)
        image_instance = get_object_or_404(Image, id=image_id, inspection_feedback=feedback_instance)

        if check_permission(request.user) and request.user.username == image_instance.created_by:
            image_instance.image.delete()
            image_instance.delete()
            return Response({"message": "Image deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        else:
            return Response({"message": "Permission Denied"}, status=status.HTTP_403_FORBIDDEN)

    except Exception as e:
        message = f'An error occurred while deleting image {image_id} for Inspection Feedback {feedback_id}'
        logging.exception(f"{message}: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
