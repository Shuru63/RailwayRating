from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from station.models import Station


class Roles(models.Model):
    name = models.CharField(max_length=100, null=True)
   
    def __str__(self):
        return self.name

def findObjRole(user_type):
    user_type = Roles.objects.filter(id=user_type).first()
    return user_type

def findIdRole(user_type):
    user_type = Roles.objects.filter(id=user_type).first()
    return user_type.id


class UserManager(BaseUserManager):
    def create_user(self, first_name, username, email, phone, user_type, station, password=None, is_staff=False, railway_admin=False):
        if not first_name:
            raise ValueError('Users must have a first name with a minimum of 3 characters.')
        
        if not username:
            raise ValueError('Users must have a username.')
        
        if not email:
            raise ValueError('Users must have an Email')
        
        if not phone:
            raise ValueError('Users must have a Mobile Number.')

        if not password:
            raise ValueError('Users must have a password.')

        user_obj = self.model(first_name=first_name, username=username,email=email,phone=phone)
        user_obj.set_password(password)
        user_obj.staff = is_staff
        user_obj.railway_admin = railway_admin
        user_obj.user_type = findObjRole(user_type)
        user_obj.station = Station.get_station_obj(station)

        user_obj.save(using=self._db)
        return user_obj

    def create_staffuser(self, first_name, username, email, phone, user_type, station, password=None):
        if not phone.isdigit() or len(phone) != 10:
            raise ValidationError("Phone number must be exactly 10 digits.")
        
        user = self.create_user(first_name, username, email, phone, user_type, station, password=password, is_staff=True)
        return user

    def create_superuser(self, first_name, username, email, phone, user_type, station, password=None):
        if not phone.isdigit() or len(phone) != 10:
            raise ValidationError("Phone number must be exactly 10 digits.")
        
        user = self.create_user(
            first_name,
            username,
            email,
            phone,
            user_type,
            station,
            password=password,
            is_staff=True,
            railway_admin=True,
        )
        return user


class Post(models.Model):
    content = models.CharField(max_length=100)


    def __str__(self):
        return self.content


class User(AbstractBaseUser, PermissionsMixin):
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, null=True, blank=True)
    last_name = models.CharField(max_length=100)
    username = models.CharField(max_length=50, unique=True)
    email = models.EmailField(unique=True)
    phone = models.CharField(unique=True,  max_length=15)
    user_type = models.ForeignKey(Roles, on_delete=models.CASCADE)
    password = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=200)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=200)
    last_login = models.DateTimeField(null=True)
    last_login_lat = models.FloatField(null=True)
    last_login_long = models.FloatField(null=True)
    last_login_city = models.CharField(max_length=200, null=True)
    nearest_station = models.CharField(max_length=200, null=True)
    is_active = models.BooleanField(default=True) 
    staff = models.BooleanField(default=False)
    railway_admin = models.BooleanField(default=False)
    station = models.ForeignKey(Station, on_delete=models.CASCADE)
    posts = models.ManyToManyField(Post, related_name='users')

    enabled = models.BooleanField(default=True) 

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['first_name', 'email', 'phone', 'user_type', 'station']

    class Meta:
        permissions = [('can_access_admin_panel', 'Can access admin panel')]

    objects = UserManager()

    def __str__(self):
        return f"{self.username} {self.user_type.name}"

    def get_full_name(self):
        return self.username

    def get_short_name(self):
        return self.username

    def has_perm(self, perm, obj=None):
        return True

    def has_module_perms(self, app_label):
        return True

    @property
    def is_staff(self):
        return self.staff

    @property
    def is_superuser(self):
        return self.railway_admin
    
    def clean_phone(self):
        phone_number = str(self.phone)
        if not phone_number.isdigit() or len(phone_number) != 10:
            raise ValidationError("Phone number must be exactly 10 digits.")

    def save(self, *args, **kwargs):
        self.clean_phone()  # Call the validation before saving
        super(User, self).save(*args, **kwargs)
    
    

def Contractor_Supervisor(user):
    user = User.objects.get(id=user)
    if user.user_type_id != 1:
        return user
    else:
        raise ValidationError(f"{user.username} is already a railway admin, please select supervisor or contractor")


# assign permission
class Assign_Permission(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, validators=[Contractor_Supervisor])

    def __str__(self):
        return f"{self.user}"


class RequestUser(models.Model):
    user_f_name = models.CharField(max_length=50)
    user_m_name = models.CharField(max_length=50, null=True, blank=True)
    user_l_name = models.CharField(max_length=50)
    user_password = models.CharField(max_length=200)
    user_email = models.EmailField()
    user_phone = models.CharField(max_length=15)
    user_type = models.CharField(max_length=20)
    user_station = models.IntegerField()
    user_posts = models.CharField(max_length=10, null=True)
    approved = models.BooleanField(default=False, null=True, blank=True)
    seen = models.BooleanField(default=False, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=200, default='')
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=200, default='')


    class Meta:
        verbose_name = 'Requested User'
        verbose_name_plural = 'Requested Users'


class RequestAccess(models.Model):
    user_f_name = models.CharField(max_length=50)
    user_m_name = models.CharField(max_length=50, null=True, blank=True)
    user_l_name = models.CharField(max_length=50)
    user_email = models.EmailField()
    user_phone = models.CharField(max_length=15)
    user_type = models.CharField(max_length=20)
    user_station = models.CharField(max_length=200,null=True, blank=True)
    access_requested = models.CharField(max_length=200, null=True, blank=True)
    for_station = models.CharField(max_length=200,null=True, blank=True)
    from_for_station = models.CharField(max_length=200,null=True, blank=True)
    to_for_station = models.CharField(max_length=200,null=True, blank=True)
    approved = models.BooleanField(default=False, null=True, blank=True)
    seen = models.BooleanField(default=False, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=200, default='')
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=200, default='')


    class Meta:
        verbose_name = 'Requested Access'
        verbose_name_plural = 'Requested Accesss'


class OTP(models.Model):
    email = models.EmailField(null=True)
    phone = models.CharField(max_length=15, null=True)
    session_id = models.CharField(max_length=100, null=True)
    data = models.CharField(max_length=50, null=True)
    otp = models.CharField(max_length=10)
    counter = models.IntegerField(default=0)
    timestamp = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=200, default='')
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=200, default='')
