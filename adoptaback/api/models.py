from django.db import models
from django.contrib.auth.models import User
from datetime import datetime

class Region(models.Model):
    nombre = models.CharField(max_length=100)

    def __str__(self):
        return self.nombre

class Comuna(models.Model):
    nombre = models.CharField(max_length=100)
    region = models.ForeignKey(Region, on_delete=models.CASCADE)

    def __str__(self):
        return self.nombre

class Profile(models.Model):
    ROL_CHOICES = [
        ('adoptante', 'Adoptante'),
        ('organizacion', 'Organizacion'),
        ('admin', 'Admin')
    ]
    auth_user = models.OneToOneField(User, on_delete=models.CASCADE)
    google_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    rut = models.CharField(max_length=12, null=True, blank=True)
    nombre_apellido = models.CharField(max_length=200, null=True, blank=True)
    telefono = models.CharField(max_length=15, null=True, blank=True)
    fecha_nacimiento = models.DateField(null=True, blank=True)
    domicilio = models.CharField(max_length=200, null=True, blank=True)
    rol = models.CharField(max_length=20, choices=ROL_CHOICES, null=True, blank=True)
    comuna = models.ForeignKey(Comuna, on_delete=models.SET_NULL, null=True)
    foto_perfil = models.ImageField(upload_to='perfil/', null=True, blank=True)

    def __str__(self):
        return self.nombre_apellido

class Organizacion(models.Model):
    nombre_organizacion = models.CharField(max_length=200)
    rut_empresa = models.CharField(max_length=12)
    
    def __str__(self):
        return self.nombre_organizacion

class Sucursal(models.Model):
    organizacion = models.ForeignKey(Organizacion, on_delete=models.CASCADE)
    nombre_sucursal = models.CharField(max_length=200)
    direccion = models.CharField(max_length=200)
    comuna = models.ForeignKey('Comuna', on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return self.nombre_sucursal

class UserOrganizacion(models.Model):
    usuario = models.ForeignKey('Profile', on_delete=models.CASCADE)
    sucursal = models.ForeignKey(Sucursal, on_delete=models.CASCADE)

    def __str__(self):
        return f'{self.usuario} - {self.sucursal}'

class EspecieMascota(models.Model):
    nombreEspecie = models.CharField(max_length=50)
    def __str__(self):
        return self.nombreEspecie

class RazaMascota(models.Model):
    nombreRaza = models.CharField(max_length=50)
    especie = models.ForeignKey(EspecieMascota, on_delete=models.CASCADE)
    def __str__(self):
        return self.nombreRaza

class Mascota(models.Model):
    """ Info general """
    imagen = models.ImageField(upload_to='', null=True, blank=True)
    microchip = models.CharField(max_length=15, unique=True)
    nombre = models.CharField(max_length=100)
    """ Info de Coincidencia para filtrar """
    fecha_nacimiento = models.DateField()
    sexo = models.CharField(max_length=10)
    color = models.CharField(max_length=50)
    patron = models.CharField(max_length=50)
    """ historial medico """
    esterilizado = models.BooleanField(default=False)
    sociable = models.BooleanField(default=False) 
    tratamiento = models.BooleanField(default=False)
    tratamientoDescripcion = models.TextField()
    actividad = models.CharField(max_length=50)
    vacunas = models.BooleanField(default=False)
    descripcion = models.TextField()
    raza = models.ForeignKey(RazaMascota, on_delete=models.CASCADE)
    def __str__(self):
        return self.nombre

class EstadoMascota(models.Model):
    ESTADO_CHOICES = [
        ('Disponible', 'Disponible'),
        ('Adoptado', 'Adoptado'),
        ('Pendiente', 'Pendiente'),

    ]
    mascota = models.ForeignKey('Mascota', on_delete=models.CASCADE, related_name='estado')
    sucursal = models.ForeignKey(Sucursal, on_delete=models.CASCADE)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES)
    fecha = models.DateField()

    def __str__(self):
        return f'{self.mascota} - {self.estado}'


class Coincidencia(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE)
    mascota = models.ForeignKey(Mascota, on_delete=models.CASCADE)

    def __str__(self):
        return f'{self.profile} - {self.mascota}'

class Adopciones(models.Model):
    fecha = models.DateField()
    regreso = models.BooleanField(default=False)
    coincidencia = models.ForeignKey(Coincidencia, on_delete=models.CASCADE)

    def __str__(self):
        return f'{self.coincidencia}'

class Evento(models.Model):
    TIPO_EVENTO_CHOICES = [
        ('Accidente', 'Accidente'),
        ('Abandono', 'Abandono')
    ]

    idEvento = models.AutoField(primary_key=True)
    tipoEvento = models.CharField(max_length=20, choices=TIPO_EVENTO_CHOICES)
    userReportante = models.CharField(max_length=200)
    userResponsable = models.CharField(max_length=200, default='No Encontrado')
    mailUserReportante = models.CharField(max_length=200, default='No Encontrado')
    mailUserResponsable = models.CharField(max_length=200, default='No Encontrado')
    sucursal = models.CharField(max_length=200, default='Sin Respuesta')
    comuna = models.CharField(max_length=200)
    region = models.CharField(max_length=200)
    fechaEvento = models.DateTimeField(default=datetime.now)
    fechaResolucion = models.DateTimeField(null=True, blank=True)
    resolucionObservacion = models.TextField(default='Sin Observacion')
    activo = models.BooleanField(default=True)
    IdSucursal = models.ForeignKey(Sucursal, null=True, blank=True, on_delete = models.CASCADE)
    lat = models.FloatField() 
    lng = models.FloatField()  
    def __str__(self):
        return f'{self.tipoEvento} - {self.userReportante}'

