import json
from django.core.management.base import BaseCommand
from datetime import datetime
from user_onboarding.models import User, Assign_Permission


class Command(BaseCommand):
    help = 'Insert data from JSON file into the database'

    def add_arguments(self, parser):
        parser.add_argument('json_file', type=str,
                            help='Path to the JSON file')

    def handle(self, *args, **options):
        json_file = options['json_file']

        try:
            with open(json_file, 'r') as file:
                data = json.load(file)

            for user_data in data:
                # Convert created_at and updated_at to datetime objects
                user_data['created_at'] = datetime.fromisoformat(
                    user_data['created_at'])
                user_data['updated_at'] = datetime.fromisoformat(
                    user_data['updated_at'])

                # Create a new User object with the data from the JSON
                new_user = User.objects.create(**user_data)

                # Create an instance of Assign_Permission and associate it with the new user
                user_permission = Assign_Permission.objects.create(
                    user=new_user)
                user_permission.save()

            self.stdout.write(self.style.SUCCESS(
                'Successfully inserted data from JSON file into the database.'))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f'An error occurred: {e}'))
