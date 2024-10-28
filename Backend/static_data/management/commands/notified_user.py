from django.core.management.base import BaseCommand
import json

from notified_task.models import notified_task
from notified_users.models import Post, notified_users
from station.models import Station


class Command(BaseCommand):
    help = 'Insert data into the database'

    def handle(self, *args, **kwargs):
        # Create or retrieve station instances
        station_codes = [100, 101, 103, 104]
        station_instances = {}
        for station_code in station_codes:
            station = Station.objects.filter(station_code=station_code).first()
            if station is not None:
                station_instances[station_code] = station
            else:
                self.stdout.write(f'Station with code {station_code} does not exist.')

        # Create or retrieve task instances
        tasks = [
            (1, 'Sanitation'),
            (2, 'Water'),
            (3, 'Electricity (Fan, Lift, Escalator)'),
            (4, 'Security'),
            (5, 'Commercial'),
            (6, 'Repair'),
            (7, 'MISC')
        ]
        task_objects = []
        for task_id, task_description in tasks:
            task, created = notified_task.objects.get_or_create(
                task_id=task_id,
                defaults={
                    'task_description': task_description,
                    'created_by': 'admin',
                    'updated_by': 'admin',
                }
            )
            if created:
                self.stdout.write(f'Created task: {task.task_id}')
            else:
                self.stdout.write(f'Task already exists: {task.task_id}')
            task_objects.append(task)

        # Load user data from JSON
        with open('./secretes.json') as secrets_file:
            data = json.load(secrets_file)
            users = data.get("NOTIFIED_USERS_PROD", {})

        # Create or retrieve user instances and assign tasks
        for user_key, user_data in users.items():
            user, created = notified_users.objects.get_or_create(
                username=user_data.get('username'),
                defaults={
                    'whatsapp_number': user_data.get('whatsapp_number'),
                    'mobile_number': user_data.get('mobile_number'),
                    'email': user_data.get('email'),
                }
            )
            if created:
                self.stdout.write(f'User created: {user.username}')
            else:
                self.stdout.write(f'User already exists: {user.username}. Skipping notification.')

            # Assign posts to user
            post_names = user_data.get('posts')
            posts_to_assign = [Post.objects.get_or_create(content=post_name)[0] for post_name in post_names]
            user.posts.set(posts_to_assign)

            # Assign tasks to user
            task_ids = user_data.get('task_ids')
            tasks_to_assign = [task for task in task_objects if task.task_id in task_ids]

            # Assign stations to user
            station_codes = user_data.get('station')
            stations_to_assign = [station_instances.get(station_code) for station_code in station_codes]
            stations_to_assign = [station for station in stations_to_assign if station is not None]

            user.assigned_tasks.set(tasks_to_assign)
            user.assigned_station.set(stations_to_assign)

            self.stdout.write(f'Tasks assigned to user: {user.username}')
