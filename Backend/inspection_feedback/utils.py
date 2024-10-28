from dateutil.parser import parse
import datetime
from rest_framework.response import Response
from rest_framework import status

from file_upload.utils import format_image
import logging
from .models import Image


def upload_inspection_feedback_images(request, feedback_instance):
    try:
        data = request.data
        user = request.user

        # Check if 'images' key is present in the request.FILES
        if 'images' not in request.FILES:
            return Response({"message": "Images missing in request"}, status=status.HTTP_400_BAD_REQUEST)

        images = request.FILES.getlist('images')

        for index, image in enumerate(images):
            fileformat = image.name.split('.')[-1]
            created_at = datetime.datetime.today()
            int_speed = 1024

            if int_speed <= 0.2:
                full_file_name = f"{user.username}_{user.station.station_name}_{feedback_instance.id}_{created_at}_{index}_lq.{fileformat}"
                image_format = 'PNG'
                quality = 40
            else:
                full_file_name = f"{user.username}_{user.station.station_name}_{feedback_instance.id}_{created_at}_{index}_hq.{fileformat}"
                image_format = 'JPEG'
                quality = 80

            new_file = format_image(image, full_file_name, image_format, quality)

            if not new_file:
                return Response({"message": f"An error occurred while processing the image: {image}"}, status=status.HTTP_400_BAD_REQUEST)
            
            Image.objects.create(inspection_feedback=feedback_instance, image=new_file)

        return True

    except Exception as e:
        message = 'An error occurred while uploading images'
        logging.exception(f"{message} in upload_inspection_feedback_images: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def is_valid_date(date):
    if date:
        try:
            parse(date)
            return True
        except:
            return False
    return False
