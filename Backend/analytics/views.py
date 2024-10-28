from datetime import date
from django_ratelimit.decorators import ratelimit
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.forms.models import model_to_dict
from django.db.models import Q

from task.models import Task
from station.models import Station
from user_onboarding.models import User, Roles
from website.decorators import allowed_users
from .funcs import handle_graph


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
@allowed_users(['supervisor', 'contractor', 'railway admin', 'officer'])
def analytics(request):
    station = request.user.station
    Context = handle_graph(request)
    today = date.today()
    formatted_today = today.strftime('%d-%m-%Y')

    if isinstance(Context, dict) and 'message' in Context:
        tasks = Task.objects.filter(station=station).values_list()
        users = User.objects.filter(
            Q(station=station, user_type__name='supervisor') | 
            Q(user_type__name='officer')
            ).values()
        
        mobile_device = 1
        try:
            if (request.COOKIES['device'] == 'larger'):
                mobile_device = 0
        except:
            pass
        context = {'Tasks': tasks, 'users': users, 'mobile_device': mobile_device, 'today': today, 'formatted_today': formatted_today}
        context.update(Context)

        return Response(context, status=status.HTTP_400_BAD_REQUEST)

    return Response(Context, status=status.HTTP_200_OK)
