from django import forms
from django.contrib.auth.forms import SetPasswordForm
from django.contrib.auth.password_validation import validate_password


class PasswordResetConfirmForm(SetPasswordForm):
    """
    A form that lets a user set their new password.
    """
    error_messages = {
        'password_mismatch': "The two password fields didn't match.",
        'password_mismatch1': "Password must be at least 5 characters long.",
    }

    new_password1 = forms.CharField(
        label="New password",
        widget=forms.PasswordInput(attrs={'autocomplete': 'new-password'}),
        strip=False,
    )

    new_password2 = forms.CharField(
        label="New password confirmation",
        strip=False,
        widget=forms.PasswordInput(attrs={'autocomplete': 'new-password'}),
    )

    def clean_new_password2(self):
        password1 = self.cleaned_data.get('new_password1')
        password2 = self.cleaned_data.get('new_password2')
        validate_password(password1)
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError(
                self.error_messages['password_mismatch'],
                code='password_mismatch',  
            )
        return password2
    

class ChangePassword(forms.Form):
    """

    A form that lets a user set their new password.

    """
    def __init__(self, *args, user, **kwargs):
        self.user = user
        super().__init__(*args, **kwargs)

    error_messages = {
        'old_password_incorrect': "Your old password was entered incorrectly. Please enter it again.",
        'password_mismatch': "The two password fields didn't match.",
        'password_mismatch1': "Password must be at least 5 characters long.",
    }

    old_password = forms.CharField(
        label="Old password",
        strip=False,
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'autocomplete': 'current-password', 'autofocus': True}),
    )
    new_password1 = forms.CharField(
        label="New password",
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'autocomplete': 'new-password'}),
        strip=False,
    )

    new_password2 = forms.CharField(
        label="New password confirmation",
        strip=False,
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'autocomplete': 'new-password'}),
    )

    def clean(self):
        cleaned_data = super().clean()
        old_password = cleaned_data['old_password']
        user = self.user
        user_password = user.check_password(old_password)
        if user_password==False:
            raise forms.ValidationError(
                self.error_messages['old_password_incorrect'],
                code='old_password_incorrect',
            )
        
        password1 = cleaned_data['new_password1']
        password2 = cleaned_data['new_password2']
        validate_password(password1)

        if password1 and password2 and password1 != password2:
            
            raise forms.ValidationError(
                self.error_messages['password_mismatch'],
                code='password_mismatch',  
            )
        


    