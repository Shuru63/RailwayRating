from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import logging
from twilio.rest import Client
import smtplib
from rest_framework.response import Response
from rest_framework import status
import datetime

from cms.settings import AUTH, EMAIL_HOST_PASSWORD, EMAIL_HOST_USER, TWILIO_CREDENTIALS
from file_upload.utils import format_image
from file_upload.serializers import NotifiedMediaSerializer


api_key = AUTH["api_key"]
email_host = EMAIL_HOST_USER
email_host_password = EMAIL_HOST_PASSWORD
account_sid = TWILIO_CREDENTIALS["ACCOUNT_SID"]
auth_token = TWILIO_CREDENTIALS["AUTH_TOKEN"]
from_mobile = TWILIO_CREDENTIALS["FROM_MOBILE"]
client = Client(account_sid, auth_token)


def send_email(subject, body, to_email):
    try:
        smtpObj = smtplib.SMTP('smtp.gmail.com', 587)
        smtpObj.starttls()
        smtpObj.login(email_host, email_host_password)

        message = MIMEMultipart()
        message['From'] = email_host
        message['To'] = to_email
        message['Subject'] = subject
        message.attach(MIMEText(body, 'plain'))
        smtpObj.sendmail(email_host, to_email, message.as_string())
        smtpObj.quit()

    except Exception as e:
        message = 'An error occurred while sending the complain mail'
        logging.exception(f"{message} in send_email: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def send_sms_message_twilio(to, body):
    try:
        success_sms = []
        fail_sms = []
        for recipient in to:
            try:
                message = client.messages.create(
                    to=f'+91{recipient}', 
                    from_= from_mobile, 
                    body=body
                )
                success_sms.append({
                    'recipient': recipient,
                    'status': message.status
                })
            except Exception as e:
                fail_sms.append({
                    'recipient': recipient,
                    'status': f'Error: {str(e)}'
                })

        sms_status = {
            'success': success_sms,
            'fail': fail_sms
        }
        return sms_status
    
    except Exception as e:
        message = 'An error occurred while sending the complain sms messages'
        logging.exception(f"{message} in send_sms_message_twilio: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def upload_notified_feedback_image(request, feedback_complaint):
        try:
            data = request.data
            user = request.user
            uploaded_files_new = []
            for key in request.FILES:
                uploaded_files_new += request.FILES.getlist(key)
            for myfile in uploaded_files_new:
                fileformat = myfile.name.split('.')[-1]
                created_at = datetime.datetime.today()
                int_speed = 1024
                if int_speed <= 0.2:
                    full_file_name = f"{user.username}_{user.station.station_name}_{feedback_complaint.task.task_id}_{created_at}_lq.{fileformat}"
                    image_format = 'PNG'
                    quality = 40
                else:
                    full_file_name = f"{user.username}_{user.station.station_name}_{feedback_complaint.task.task_id}_{created_at}_hq.{fileformat}"
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
                        'feedback_complaint': feedback_complaint.id,
                        'user': user.id,
                        'created_by': user.username,
                        'updated_by': user.username
                    })

                except KeyError as e:
                    return Response({"message": f"Data missing: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)

                serializer = NotifiedMediaSerializer(data=data)
                if serializer.is_valid(raise_exception=True):
                    serializer.save()    
                    logging.info(f"Image uploaded successfully: {serializer.data}")
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            return True
                    
        except Exception as e:
            message = 'An error occurred while uploading images'
            logging.exception(f"{message} in upload_notified_feedback_image: {repr(e)}")
            return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



# def send_sms_message_2_factor(to, body):
#     url = "https://2factor.in/API/R1/"
#     params = {
#         "module": "TRANS_SMS",
#         "apikey": api_key,
#         "to": f"+91{to}",
#         "from": "HEADER",
#         "msg": body
#     }
#     print(f"params for sms from complain is {params}")
#     response = requests.post(url, data=params)
#     print(f"response for sms from complain is {response}")
#     if response.status_code == 200:
#         return "success"
#     else:
#         return "failed"


