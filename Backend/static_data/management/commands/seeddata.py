import subprocess
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    def handle(self, *args, **options):
        commands = [
            'insert_role',
            'insert_data_pnbe',
            'insert_data_dnr',
            'insert_data_ppta',
            'insert_data_rjpb',
            'insert_data_pnc',
            'insert_data_kiul',
            'insert_data_jmu',
            'insert_data_bkp',
            'insert_data_ara',
            'insert_data_mka',
            'insert_data_bxr',
            'insert_data_bde',
            # Removed insert_user and insert_notified_user as they are redundant
            ]
        for command in commands:
            full_command = f'python manage.py {command}'
            try:
                self.stdout.write(self.style.SUCCESS(f"Running: {full_command}"))
                proc = subprocess.Popen(full_command, shell=True)
                proc.communicate()
                self.stdout.write(self.style.SUCCESS(f"Finished: {full_command}"))
            except Exception:
                self.stdout.write(self.style.ERROR(f"Error Running: {full_command}"))
