from django import template
import datetime
from django import template

from task_shift_occurrence.models import TaskShiftOccurrence
from ratings.models import Rating
from file_upload.models import Media
from task.models import Task, CycleDate
from shift.models import Shift
from pax_deployed.models import Pax
from website.utils import alternate_weekday


register = template.Library()


@register.filter(name='valid_task_date')
def valid_task_date(task_id,date):

    return True


@register.filter(name='is_alternate_weekday')
def is_alternate_weekday(date, weekday):
    date_object = datetime.datetime.strptime(date, '%Y-%m-%d')
    return alternate_weekday(datetime.datetime.date(date_object), int(weekday))


@register.filter(name='has_non_daily_task')
def has_non_daily_task(station, cycle_type):
    return Task.objects.filter(station=station, cleaning_cycle_type=cycle_type).exists()


@register.filter(name='has_rating_required')
def has_rating_required(task):
    return TaskShiftOccurrence.objects.filter(task=task, rating_required=True).exists()


@register.filter(name='last_cycle')
def last_cycle(task):
    if CycleDate.objects.filter(task=task).exists():
        last_enabled = CycleDate.objects.filter(task=task).order_by('cycle').last().cycle
        return last_enabled
    
    else:
        return None


@register.filter(name='next_cycle')
def next_cycle(task):
    if CycleDate.objects.filter(task=task).exists():
        next_cycle = CycleDate.objects.filter(task=task).order_by('next_cycle').last().next_cycle
        return next_cycle
    
    else:
        return None
    

@register.filter(name='get_occurrence_value')
def get_occurrence_value(value, task_media_dict):
    # print(task_media_dict)
    task_id_str = value[:-2]
    shift_id_str = value[-2]
    occurrence_id_str = value[-1]
    task_id = int(task_id_str)
    shift_id = int(shift_id_str)
    occurrence_id = int(occurrence_id_str)
    occurrence_value = task_media_dict.get(task_id, {}).get(shift_id, {}).get(occurrence_id, False)
    if occurrence_value:
        return 'Y'
    else:
        return 'N'

@register.filter
def concat(value, arg):
    return str(value) + str(arg)


@register.filter(name='Get_id')
def Get_id(a):
    
    return a.id


@register.filter(name='Pax_shift1')
def Pax1(date,shift_id):
    shift=Shift.objects.filter(id=shift_id).first()
    pax=list(Pax.objects.filter(date=date,shift=shift).all())
    pax.reverse()
    return pax
@register.filter(name='Pax_shift2')
def Pax1(date,shift_id):
    shift=Shift.objects.filter(id=shift_id).first()
    pax=list(Pax.objects.filter(date=date,shift=shift).all())
    pax.reverse()

    return pax
@register.filter(name='Pax_shift3')
def Pax1(date,shift_id):
    shift=Shift.objects.filter(id=shift_id).first()
    pax=list(Pax.objects.filter(date=date,shift=shift).all())
    pax.reverse()
    return pax





@register.filter(name='Pax_f')
def Pax1(date,shift_id):
    shift=Shift.objects.filter(id=shift_id).first()
    pax=Pax.objects.filter(date=date,shift=shift).last()
    if pax:
        return pax.id
    else:
        return "0"
@register.filter(name='Pax_status')
def Pax1(id):
    
    pax=Pax.objects.filter(id=id).last()
    return pax.pax_status
@register.filter(name='Pax_status1')
def Pax1(id):
    
    pax=Pax.objects.filter(id=id).last()
    if(pax):
        return pax.pax_status
    return 'Pending'

@register.filter(name='Pax_count')
def Pax1(id):
    
    pax=Pax.objects.filter(id=id).last()
    return pax.count

    

    
 


@register.filter(name='Check_str_int')
def Check_str_int(a):
    
    return isinstance(a, str)



@register.filter(name='Today_date')
def Today_date(a):
    date=datetime.datetime.now()
    formatted_date = date.strftime('%d %b. %Y, %H:%M')
    return formatted_date



@register.filter(name='camp')
def zip_lists(a, b):
    a=int(a)
    b=int(b)
    return a<=b
@register.filter(name='multi')
def zip_lists(a, b):
    a=int(a)
    b=int(b)
    return int(a*b)

@register.filter(name='int')
def zip_lists(a, b):
    a=float(a)
    b=float(b)
    # print("hello there",a==b)
    return a==b

@register.filter(name='zip')
def zip_lists(a, b):
  return zip(a, b)

@register.filter(name='zip2')
def zip_lists(a, b):
  swap=a[0].shift_id
  if (swap!=3):
    a[0], a[1], a[2] = a[2], a[0], a[1]
  b[0], b[1], b[2] = b[2], b[0], b[1]
  return zip(a, b)

@register.filter(name='range')
def ranges(x):
    list=[]
    for i in range(0,x):
        list.append('a')
    return list

@register.filter(name='taskShift')
def one_more(_1, _2):
    return _1, _2

@register.filter(name='task_shift')
def your_filter(_1_2, _3):
    task, shift = _1_2
    return TaskShiftOccurrence.objects.filter(task=task,shift=shift,occurrence_id=_3).first()

@register.filter(name='task_shift_pdf')
def your_filter(_1_2, _3):
    
    return TaskShiftOccurrence.objects.filter(task=_1_2,shift=_3).all()

@register.filter(name='contains_lq')
def contains_lq(url):
    return "_lq" in url


# @register.filter
# def task_shift(task,shift,occurrence_id):
#     return TaskShiftOccurrence.objects.filter(task=task,shift=shift,occurrence_id=occurrence_id).first()

@register.filter(name='rating')
def rating1(task_shift_occur_id,dateStation):
    date = dateStation[0]
    stationName = dateStation[1]
    rating=Rating.objects.filter(date=date,task_shift_occur_id=task_shift_occur_id,user__station__station_name=stationName).last()
    if not rating:
        return "Pending"
    else:
        rating.task_status
        return rating.rating_value

    
@register.filter(name='task_status')
def rating1(task_shift_occur_id,date):
    rating=Rating.objects.filter(date=date,task_shift_occur_id=task_shift_occur_id).last()
    if  rating:
        return rating.task_status
    else:
        return "nil"
    
    
@register.filter(name='rating_col')
def rating1(task_shift_occur_id,date):
    rating=Rating.objects.filter(date=date,task_shift_occur_id=task_shift_occur_id).last()
    media=Media.objects.filter(date=date,task_shift_occur_id=task_shift_occur_id).last()
    if media:
        return "color:grey;  "
    else:
        return "display:none;  "
@register.filter(name='Media')
def media(task_shift_occur_obj_all,date):
    
    media1=[]
    for x in task_shift_occur_obj_all:
        media=Media.objects.filter(date=date,task_shift_occur_id=x).all()
        if media:
            for y in media:
                media1.append(y)
            
    # media=list(Media.objects.filter(date=date,task=task).all())
    # print(media1)
    
    return media1
@register.filter(name='rating_pdf')
def rating1(task_shift_occur_id,date):
    rating=Rating.objects.filter(date=date,task_shift_occur_id=task_shift_occur_id).last()
    if not rating:
        return "x"
    else:
        return rating.rating_value




@register.filter
def convertint(str_w):
    return int(str_w)



@register.filter
def index(num, i):
    index_number = i-1
    return num[index_number]



@register.filter
def floatconvert(num):
    return float(num)
    

@register.filter
def length(lis):
    return len(lis)

@register.filter(name='dict_key')
def dict_item(dictionary, i):
    a = dictionary[i]
    return a

@register.filter(name='has_group') 
def has_group(user, group_name):
    return user.groups.filter(name=group_name).exists() 

@register.filter
def to_or(value):
    return value.replace("/"," or ")