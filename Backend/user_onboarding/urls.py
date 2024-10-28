from django.urls import path
from django.contrib.auth import views as auth_views

from .views.authentication import (
    GoogleSocialAuthView, 
    UserLoginView, 
    UserLogoutView, 
    login_using_otp_send, 
    login_using_otp_verify
    )
from .views.pass_reset import password_reset_request, password_reset_confirm
from .views.request_user import (
    UserRequestUserView, 
    verify_email, 
    confirm_email, 
    verify_phone, 
    confirm_phone_ver, 
    show_requested_user, 
    user_requested, 
    enable_disable_user, 
    )
from .views.user_profile import (
    profile, 
    edit_profile, 
    change_password, 
    change_pass_otp, 
    change_phone, 
    confirm_change_phone, 
    change_email, 
    change_email_otp,
    deactivate_account
    )
from .views.request_access import (
    change_accessed_station, 
    show_requested_access, 
    access_requested, 
    change_station, 
    access_station, 
    new_station_access,
    home_station,
    change_station_editprofile,
    )


urlpatterns = [
    path("login/", UserLoginView.as_view(), name="login"),
    path("logout/", UserLogoutView.as_view(), name="logout"),
    path('google/', GoogleSocialAuthView.as_view()),
    path('login-using-otp-send/', login_using_otp_send, name='login_using_otp_send'),
    path('login-using-otp-verify/', login_using_otp_verify, name='login_using_otp_verify'),

    path("password_reset/", password_reset_request, name="password_reset"),
    path('password_reset/done/', auth_views.PasswordResetDoneView.as_view(template_name='user/password_reset_done.html'), name='password_reset_done'),
    path('reset/<uidb64>/<token>/', password_reset_confirm, name='password_reset_confirm'),
    path('reset/done/', auth_views.PasswordResetCompleteView.as_view(template_name='user/password_reset_complete.html'), name='password_reset_complete'),

    path("request-user/", UserRequestUserView.as_view(), name="signup"),
    path("request-user/verify-email/", verify_email, name="verify_email"),
    path("request-user/confirm-email/", confirm_email, name="confirm_email"),
    path('request-user/verify_phone/', verify_phone, name='verify_phone'),
    path('request-user/confirm_phone_ver/', confirm_phone_ver, name='confirm_phone_ver'),
    path('show_requested_user/', show_requested_user, name='show_requested_user'),
    path('user_requested/<int:user_id>/', user_requested, name='user_requested'),
    path('enable_disable_user/', enable_disable_user, name='enable_disable_user'),

    path('profile/', profile, name='profile'),
    path('profile/edit-profile/', edit_profile, name='edit_profile'),
    path('profile/edit-profile/change_password/', change_password, name='change_password'),
    path('profile/edit-profile/change-password/enter-otp/', change_pass_otp, name='change_pass_otp'),
    path('profile/edit-profile/change-phone/', change_phone, name='change_phone'),
    path('profile/edit-profile/change-phone/conf-otp/', confirm_change_phone, name='confirm_change_phone'),
    path('profile/edit-profile/change-email/', change_email, name='change_email'),
    path('profile/edit-profile/change-email/enter-otp/', change_email_otp, name='change_email_otp'),
    path('profile/edit-profile/deactivate-account/', deactivate_account, name='deactivate_account'),

    path('requested-access/', show_requested_access, name='show_requested_access'),
    path('access-requested/<int:user_id>/<str:access_requested>', access_requested, name='access_requested'),
    path('change_station/<str:station_name>', change_station, name='change_station' ),
    path('change_accessed_station/<str:station_name>', change_accessed_station, name='change_accessed_station' ),
    path('access_station', access_station, name='access_station' ),
    path('new_station_access', new_station_access, name='new_station_access' ),
    path('home_station', home_station, name='home_station' ),
    path('change_station_editprofile', change_station_editprofile, name='change_station_editprofile' ),
]
