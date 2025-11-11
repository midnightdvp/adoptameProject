from django.contrib.auth import authenticate as django_authenticate
from api.models import User

def authenticate(*args, **kwargs):
    email_or_phone = kwargs.pop('email_or_phone', None)
    password = kwargs.pop('password', None)
    # Intentar autenticar mediante el correo electrónico
    user = None
    if email_or_phone:
        user = django_authenticate(username=email_or_phone, password=password)
        if not user and '@' not in email_or_phone:
            # Si la autenticación por correo electrónico falla, intentar autenticar por número de teléfono
            user = User.objects.filter(phone_number=email_or_phone).first()
            if user and user.check_password(password):
                return user
    return user