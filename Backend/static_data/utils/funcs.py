from datetime import timedelta


def add_time(time1, time2):
    time1 = [int(i) for i in str(time1).split(":")]
    time2 = [int(i) for i in str(time2).split(":")]
    time1 = timedelta(hours=time1[0], minutes=time1[1], seconds=time1[2])
    time2 = timedelta(hours=time2[0], minutes=time2[1], seconds=time2[2])
    result = time1 + time2
    result = result - result.days * timedelta(days=1)
    return str(result)

def sub_time(time1, time2):
    time1 = [int(i) for i in str(time1).split(":")]
    time2 = [int(i) for i in str(time2).split(":")]
    time1 = timedelta(hours=time1[0], minutes=time1[1], seconds=time1[2])
    time2 = timedelta(hours=time2[0], minutes=time2[1], seconds=time2[2])
    result = time1 - time2
    result = result - result.days * timedelta(days=1)
    return str(result)

def divide_time(time1, divisor):
    time1 = [int(i) for i in time1.split(":")]
    time1 = timedelta(hours=time1[0], minutes=time1[1], seconds=time1[2])
    result = time1 / divisor
    return str(result)


def get_occurrence_list(station_name):
    OCCURRENCE_LISTS = {
        'JHD': [[1], [1]],
        'KOO': [[1], [1]],
        'JAJ': [[2], [1], [1], [2], [1]],
        'RGD': [[1], [1], [1]],
        'BEHS': [[1], [1]],
        'GZH': [[1], [1]],
        'FUT': [[1], [1]],
        'BARH': [[1], [1], [1], [1]],
        'BEA': [[1], [1]],
        'DLN': [[1], [1], [1], [1]],
        'LKR': [[1], [1]],
        'BTA': [[1], [1]],
    }
    if station_name not in OCCURRENCE_LISTS:
        return False

    return OCCURRENCE_LISTS.get(station_name)
