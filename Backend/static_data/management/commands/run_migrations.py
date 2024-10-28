import subprocess
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    def handle(self, *args, **options):
        commands = [
            'makemigrations comment',
            'makemigrations feedback',
            'makemigrations file_upload',
            'makemigrations inspection_feedback',
            'makemigrations notified_task',
            'makemigrations notified_data',
            'makemigrations notified_users',
            'makemigrations pax_deployed',
            'makemigrations ratings',
            'makemigrations shift',
            'makemigrations station',
            'makemigrations task',
            'makemigrations task_shift_occurrence',
            'makemigrations user_onboarding',
            'makemigrations pdf',
            'makemigrations',

            'migrate comment',
            'migrate feedback',
            'migrate file_upload',
            'migrate inspection_feedback',
            'migrate notified_task',
            'migrate notified_data',
            'migrate notified_users',
            'migrate pax_deployed',
            'migrate ratings',
            'migrate shift',
            'migrate station',
            'migrate task',
            'migrate task_shift_occurrence',
            'migrate user_onboarding',
            'migrate pdf',
            'migrate'
            ]
        for command in commands:
            full_command = f'python manage.py {command}'
            try:
                self.stdout.write(self.style.SUCCESS(f"Running: {full_command}"))
                proc = subprocess.Popen(full_command, shell=True)
                proc.communicate()
            except Exception:
                self.stdout.write(self.style.ERROR(f"Error Running: {full_command}"))
