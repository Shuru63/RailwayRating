from django.core.management.base import BaseCommand
from datetime import timedelta
from django.utils import timezone

from user_onboarding.models import OTP


class Command(BaseCommand):
    help = "Delete all expired objects in OTP model."

    def handle(self, *args, **kwargs):
        otp_entries = OTP.objects.all()
        for entry in otp_entries:
            expiry_time = entry.timestamp + timedelta(minutes=10)
            if timezone.now() > expiry_time or entry.counter >= 3:
                entry.delete()
