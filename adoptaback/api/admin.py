from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import *

# Register your models here.

admin.site.register(Region)
admin.site.register(Comuna)
admin.site.register(Profile)
admin.site.register(Organizacion)
admin.site.register(Sucursal)
admin.site.register(UserOrganizacion)
admin.site.register(Mascota)
admin.site.register(EstadoMascota)
admin.site.register(Coincidencia)
admin.site.register(Adopciones)
admin.site.register(Evento)