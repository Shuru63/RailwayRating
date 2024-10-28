import datetime
from django.core.management.base import BaseCommand
import json
from django.core.serializers.json import DjangoJSONEncoder

from user_onboarding.models import User

class CustomJSONEncoder(DjangoJSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime.datetime):
            return obj.strftime('%Y-%m-%dT%H:%M:%S')
        return super().default(obj)

class Command(BaseCommand):
    help = 'Retrieve data and generate JSON file'

    def handle(self, *args, **kwargs):
        users = User.objects.all().values()
        file_path = "users.json"

        with open(file_path, "w") as json_file:
            json.dump(list(users), json_file, cls=CustomJSONEncoder)

        self.stdout.write(self.style.SUCCESS(f'Successfully retrieved {len(users)} users and saved to {file_path}'))
