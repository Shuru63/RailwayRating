import random
from django.utils.dateparse import parse_datetime
from datetime import timedelta
from django.db.models import Prefetch
from django.core import serializers

from shift.models import Shift
from task_shift_occurrence.models import TaskShiftOccurrence
from task.models import Task
from station.models import Station
from ratings.models import Rating
from user_onboarding.models import User


occurrence_list_A = [[3, 2, 1], [2, 2, 1], [2, 1, 1], [3, 3, 1], [3, 3, 2], [3, 3, 1], [2, 1, 1], [1, 'NIL', 1], [1, 1, 1], [1, 1, 'NIL'], [1, 'NIL', "NIL"], [1, 1, 'NIL'], [1, 'NIL', 'NIL'], [2, 2, 1], [2, 1, 1], [1, 1, 'NIL'], [4, 4, 2], [3, 2, 1], [1, 'NIL', "NIL"], [3, 2, 1], [1, 1, 'NIL'], [1, 'NIL', 'NIL'], [1, 'NIL', 'NIL'], ['NIL', 'NIL', 1], [1, 'NIL', 'NIL']]
occurrence_list_B = [[1, 1, 1], [2, 2, 1], [1, 1, 1]]
occurrence_list_C = [[3, 3, 1], [2, 2, 1]]


def sum_rating():
    total_sum = 0
    for occurrence_list in [occurrence_list_A, occurrence_list_B, occurrence_list_C]:
        for sublist in occurrence_list:
            for item in sublist:
                if item != 'NIL':
                    total_sum += item
    return total_sum


barColors = ['red', 'green','blue','orange','brown','yellow']
# barColors = ['red', 'green', 'blue', 'orange', 'brown', 'yellow']
extension = 70 - len(barColors)
for i in range(extension):
    barColors.append('#{:06x}'.format(random.randint(0, 256**3)))
    

def handle_graph(request):
    dates = []
    rating_users = []

    if request.user.user_type.name == "officer":
        stations = Station.objects.all().values_list()
    else:
        stations = Station.objects.filter(station_name=request.user.station.station_name).values_list()

    if request.method == 'POST':
        post = True
        start_date = parse_datetime(request.data.get('start_date'))
        end_date = parse_datetime(request.data.get('end_date'))
        user_str = request.data.get('user')
        users = user_str.split(',') if user_str else None
        Task_str = request.data.get('task')
        Tasks = Task_str.split(',') if Task_str else None
        rating_str = request.data.get('rating_value')
        ratings = rating_str.split(',') if rating_str else None
        split_date = request.data.get('split_date')
        station_str = request.data.get("station_value")
        stations = station_str.split(",")  if station_str else None
        selected_stations = stations.copy() if stations else None

        if not user_str:
            error_message = {'message': 'You have to select at least one User'}
            return error_message
        if not Task_str:
            error_message = {'message': 'You have to select at least one Task'}
            return error_message
        if not rating_str:
            error_message = {'message': 'You have to select at least one Rating'}
            return error_message
        if not station_str:
            error_message = {'message': 'You have to select at least one Station'}
            return error_message
        if not start_date:
            error_message = {'message': 'Please select start date'}
            return error_message
        if not end_date:
            error_message = {'message': 'Please select end date'}
            return error_message
        if start_date and end_date and start_date > end_date:
            error_message = {'message': 'Please select a valid date range'}
            return error_message
        

        if len(users) == 0:
            error_message = {'message': 'Please select users'}
            return error_message
        if len(Tasks) == 0:
            error_message = {'message': 'Please select tasks'}
            return error_message
        if len(ratings) == 0:
            error_message = {'message': 'Please select ratings'}
            return error_message
        if len(stations) == 0:
            error_message = {'message': 'Please select station'}
            return error_message

        dates = []
        rating_users = []

        if split_date is None:
            task_shift_occlist = TaskShiftOccurrence.objects.filter(task__id__in=Tasks).prefetch_related(Prefetch('rating_set', queryset=Rating.objects.filter(user__id__in=users)))
            current_date = start_date
            while current_date <= end_date:
                dates.append(current_date.strftime("%d-%m-%Y"))
                current_date += timedelta(days=1)
            for index, user in enumerate(users):
                  user22 = User.objects.filter(id=int(user)).first()
                  role = user22.user_type.name
                  rating_user = []
                  if role == 'supervisor':
                    current_date = start_date
                    while current_date <= end_date:
                        cnt = 0
                        ratings_all = Rating.objects.filter(date=current_date.strftime("%Y-%m-%d"), user=user22, task_shift_occur_id__in=task_shift_occlist)
                        for x in ratings_all:
                            for i in ratings:
                                if x.rating_value == i:
                                    cnt += 1
                        rating_user.append(cnt)
                        current_date += timedelta(days=1)
                    color = barColors[index]
                    user_json = serializers.serialize('json', [user22])
                    rating_users.append({'user': user_json, 'rating_cnt': rating_user, 'color': color})

        else:
            task_shift_occlist_1 = []
            for sh in range(1, 4):
                station = request.user.station
                shift = Shift.objects.filter(station=station, shift_id=sh).first()
                task_shift_occlist_11 = TaskShiftOccurrence.objects.filter(shift=shift, task__task_id__in=Tasks, task__station__station_name__in=selected_stations).prefetch_related(Prefetch('rating_set', queryset=Rating.objects.filter(user__id__in=users)))

                task_shift_occlist_1.append(task_shift_occlist_11)

            current_date = start_date
            while current_date <= end_date:
                for ab in range(0, 3):
                    dates.append(current_date.strftime("%d-%m-%Y") + ' Shift- ' + str(ab + 1))
                current_date += timedelta(days=1)
            for index, user in enumerate(users):
                user22 = User.objects.filter(id=int(user)).first()
                current_date = start_date
                rating_user = []
                while current_date <= end_date:
                    for task_shift_occlist in task_shift_occlist_1:
                        cnt = 0
                        ratings_all = Rating.objects.filter(date=current_date.strftime("%Y-%m-%d"), user=user22, task_shift_occur_id__in=task_shift_occlist)
                        for x in ratings_all:
                            for i in ratings:
                                if x.rating_value == i:
                                    cnt += 1
                        rating_user.append(cnt)
                    current_date += timedelta(days=1)
                color = barColors[index]
                user_json = serializers.serialize('json', [user22])
                rating_users.append({'user': user_json, 'rating_cnt': rating_user, 'color': color})

        if request.user.user_type.name == "officer":
            Taskk = Task.objects.filter(station__station_name__in=stations).values_list()
            userr1 = User.objects.filter(station__station_name__in=stations, user_type__name='supervisor').values_list()

        else:
            Taskk = Task.objects.filter(station=request.user.station).all().values_list()
            userr1 = User.objects.filter(station=request.user.station, user_type__name='supervisor').values_list()

        officer_users = User.objects.filter(user_type__name='officer').values_list()
        userr1 = userr1.union(officer_users)
        mobile_device = 1
        try:
            if (request.COOKIES['device'] == 'larger'):
                mobile_device = 0
        except:
            pass

        context = {'dates': dates, 'rating_users': rating_users, 'Tasks': Taskk, 'users': userr1, 'stations': stations, "selected_stations": selected_stations, "user_count": len(rating_users), 'mobile_device': mobile_device}
        return context
    

    else:
        if request.user.user_type == "officer":
            Taskk = Task.objects.filter(station__station_name__in=stations).values_list()
            userr1 = User.objects.filter(
                station__station_name__in=stations, user_type__name='supervisor').values_list()

        else:
            Taskk = Task.objects.filter(station=request.user.station).all().values_list()
            userr1 = User.objects.filter(
                station=request.user.station, user_type__name='supervisor').values_list()

        officer_users = User.objects.filter(user_type__name='officer').values_list()
        userr1 = userr1.union(officer_users)
        mobile_device = 1
        try:
            if (request.COOKIES['device'] == 'larger'):
                mobile_device = 0
        except:
            pass

        selected_stations = [station.station_name for station in Station.objects.all()]

        context = {'dates': dates, 'rating_users': rating_users, 'Tasks': Taskk, 'users': userr1, 'stations': stations, 'selected_stations': selected_stations, "user_count": len(rating_users), 'mobile_device': mobile_device}
        return context
    