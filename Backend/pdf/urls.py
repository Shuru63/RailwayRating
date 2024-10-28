from django.urls import path

from .views import (
    which_pdf, 
    daily_buyers_rating_sheet_pdf, 
    daily_pdf, 
    monthly_pdf, 
    get_pre_daily_feedback, 
    signature_daily_evaluation, 
    complaints_pdf,
    bde_monthly_pdf,
    bde_daily_consolidated_pdf,
    mail_monthly_daily_reports
)


urlpatterns = [
    path('whichpdf', which_pdf, name='whichpdf'),
    path('daily/', daily_pdf, name='daily_pdf'),
    path('daily-buyers-sheet/', daily_buyers_rating_sheet_pdf, name='daily_buyers_rating_sheet_pdf'),
    path('daily/bde-consolidated/', bde_daily_consolidated_pdf, name='bde_daily_consolidated_pdf'),
    path('monthly/', monthly_pdf, name='monthly_pdf'),
    path('monthly/mail-daily-reports/', mail_monthly_daily_reports, name='mail_monthly_daily_reports'),
    path('monthly/bde/', bde_monthly_pdf, name='bde_monthly_pdf'),
    path('get_pre_daily_feedback', get_pre_daily_feedback, name='get_pre_daily_feedback'),
    path('signature_daily_evaluation', signature_daily_evaluation, name='signature_daily_evaluation'),
    path('complaints/details/<str:date>/', complaints_pdf, name='complaints_pdf'),
]
