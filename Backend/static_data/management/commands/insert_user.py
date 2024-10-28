from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
import json

from user_onboarding.models import User, Roles, Assign_Permission, Post
from station.models import Station


class Command(BaseCommand):
    help = 'Insert data into the database'

    def handle(self, *args, **kwargs):
        with open('./secretes.json') as secrets_file:
            data = json.load(secrets_file)
            users = data.get("GENERIC_USERS_PROD", {})

            for user_key, user_data in users.items():
                station = Station.objects.filter(station_name=user_data.get('station')).first()
                role = Roles.objects.filter(name=user_data.get('role')).first()
                username = self.generate_username(user_data.get('first_name'), user_data.get('phone'))
                first_name = user_data.get('first_name')
                middle_name = user_data.get('middle_name')
                last_name = user_data.get('last_name')
                self.create_or_update_user(station, first_name, middle_name, last_name, username,
                                           user_data.get('email_id'), user_data.get('password'), role,
                                           user_data.get('phone'), user_data.get('posts'))

        self.stdout.write(self.style.SUCCESS('Users inserted successfully'))

    def create_or_update_user(self, station, first_name, middle_name, last_name, username, email, password, user_type, phone, posts=None):
        defaults = {
            'username': username,
            'station': station,
            'first_name': first_name,
            'middle_name': middle_name,
            'last_name': last_name,
            'email': email,
            'password': make_password(password, salt=None, hasher='default'),
            'user_type': user_type,
            'phone': phone
        }
        user, created = User.objects.update_or_create(defaults=defaults, username=username)

        post_names = posts
        posts_to_assign = [Post.objects.get_or_create(content=post_name)[0] for post_name in post_names]
        user.posts.set(posts_to_assign)

        if created:
            Assign_Permission.objects.create(user=user)
            self.stdout.write(f'Created user: {user.username}')
        else:
            self.stdout.write(f'Updated user: {user.username}')

    def generate_username(self, first_name, phone):
        username = f'{first_name}_{phone}'
        return username.lower()
