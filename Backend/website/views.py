from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_ratelimit.decorators import ratelimit
import time
import requests


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
def Home(request):
    user = request.user
    sup = user.user_type.name
    messages = []
    if sup in ['supervisor', 'railway admin', 'officer']:
        messages.append('You can read and write ratings')
    if sup == 'contractor':
        messages.append('You can read ratings and upload Images')

    if sup in ['officer', 'railway admin']:
        messages.append('current station is'+' '+request.user.station.station_name)

    mobile_device = 1
    try:
        if(request.COOKIES['device']=='larger'):
            mobile_device = 0
    except:
        pass
    return Response({'messages': messages, 'mobile_device': mobile_device, 'sup':sup}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def speed_test(request):
    url = 'https://cmsdnrmediabucketimage.s3.ap-south-1.amazonaws.com/images/DNR/Virendra_8651192566_2_afternoon_1_PPTA_2023-08-15_153530.809266.jpg' 

    start_time = time.time()
    response = requests.get(url)
    end_time = time.time()

    if response.status_code == 200:
        download_time = end_time - start_time
        file_size_mb = len(response.content) / 1024 / 1024
        speed_mbps = file_size_mb / download_time
        return Response({'speed_mbps': speed_mbps}, status=status.HTTP_200_OK)
    else:
        return Response({'error': 'Failed to fetch the file'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def health_check(request):
    response_data = {
        'Health': 'OK',
    }

    return Response(response_data, status=status.HTTP_200_OK)
