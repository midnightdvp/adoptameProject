from rest_framework import serializers
from .models import *
from django.contrib.auth import authenticate
from .utils import authenticate

""" Usuario """
class UserValidationSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            user = User.objects.get(email=value)
            profile = Profile.objects.get(auth_user=user)
            return {
                'email': user.email,
                'profile_id': profile.id
            }  # Retorna el email y el id del perfil si el usuario existe
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist.")
        except Profile.DoesNotExist:
            raise serializers.ValidationError("Profile for this user does not exist.")
        
class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]
        
class UserRegisterSerializer(serializers.ModelSerializer):
    password1 = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password1", "password2"]
        extra_kwargs = {"password": {"write_only": True}}

    def validate(self, attrs):
        if attrs["password1"] != attrs["password2"]:
            raise serializers.ValidationError("Las contraseñas no coinciden")

        if User.objects.filter(email=attrs.get("email")).exists():
            raise serializers.ValidationError("Este correo electrónico ya está registrado")

        return attrs
    
    def create(self, validated_data):
        password = validated_data.pop("password1")
        validated_data.pop("password2")

        # Crea el usuario sin pasar username explícitamente si ya está en validated_data
        user = User.objects.create_user(**validated_data, password=password)
        return user
        
""" Serializador para region y comuna """
class ComunaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comuna
        fields = ['id', 'nombre', 'region']

class RegionSerializer(serializers.ModelSerializer):
    comunas = ComunaSerializer(many=True, read_only=True)

    class Meta:
        model = Region
        fields = ['id', 'nombre', 'comunas']

class ProfileSerializer(serializers.ModelSerializer):
    region_id = serializers.IntegerField(source='comuna.region.id', read_only=True)
    email = serializers.EmailField(source='auth_user.email', read_only=True)

    class Meta:
        model = Profile
        fields = ['id', 'google_id', 'rut', 'nombre_apellido', 'telefono', 'fecha_nacimiento', 'domicilio', 'rol', 'comuna', 'foto_perfil', 'region_id', 'email']
        read_only_fields = ['region_id', 'email']

""" Serializador Organizacion y Usuario Organizacion """
class OrganizacionSerializer(serializers.ModelSerializer):

    class Meta:
        model = Organizacion
        fields = ['id', 'nombre_organizacion', 'rut_empresa']

class SucursalSerializer(serializers.ModelSerializer):
    region_id = serializers.IntegerField(source='comuna.region.id', read_only=True)

    class Meta:
        model = Sucursal
        fields = ['id', 'organizacion', 'nombre_sucursal', 'direccion', 'comuna', 'region_id']
        read_only_fields = ['region_id']

class SucursalOrganizacionSerializer(serializers.ModelSerializer):
    organizacion = OrganizacionSerializer()

    class Meta:
        model = Sucursal
        fields = ['id', 'nombre_sucursal', 'direccion', 'comuna', 'organizacion']

class UserOrganizacionSerializer(serializers.ModelSerializer):
    rut = serializers.CharField(source='usuario.rut', read_only=True)
    nombre_apellido = serializers.CharField(source='usuario.nombre_apellido', read_only=True)

    class Meta:
        model = UserOrganizacion
        fields = ['id', 'usuario', 'sucursal', 'rut', 'nombre_apellido']

""" Serializador Estado Mascota """
class EstadoMascotaSerializador(serializers.ModelSerializer):
    class Meta:
        model = EstadoMascota
        fields = ['id','mascota', 'sucursal', 'estado', 'fecha']

""" Serializador Mascota """
class MascotaSerializer(serializers.ModelSerializer):
    especie_id = serializers.IntegerField(source='raza.especie.id', read_only=True)
    nombreEspecie = serializers.SerializerMethodField()
    nombreRaza = serializers.SerializerMethodField()
    estado = serializers.SerializerMethodField()

    class Meta:
        model = Mascota
        fields = ['id', 'imagen', 'microchip', 'nombre', 'fecha_nacimiento', 'sexo', 'color', 'patron', 'esterilizado', 'sociable', 'tratamiento', 'tratamientoDescripcion', 'actividad', 'vacunas', 'descripcion', 'raza', 'especie_id','nombreEspecie','nombreRaza','estado']
        read_only_fields = ['especie_id', 'estado']
    
    def get_nombreEspecie(self, obj):
        return obj.raza.especie.nombreEspecie if obj.raza and obj.raza.especie else None

    def get_nombreRaza(self, obj):
        return obj.raza.nombreRaza if obj.raza else None    

    def get_estado(self, obj):
        estado_mascota = EstadoMascota.objects.filter(mascota=obj).first()
        if estado_mascota:
            return estado_mascota.estado
        return None
    
""" Serializador Especie y Raza """
class RazaSerializer(serializers.ModelSerializer):
    class Meta:
        model = RazaMascota
        fields = ['id', 'nombreRaza', 'especie']

class EspecieSerializer(serializers.ModelSerializer):
    razas = RazaSerializer(many=True, read_only=True)

    class Meta:
        model = EspecieMascota
        fields = ['id', 'nombreEspecie', 'razas']

""" Serializador Coincidencia """
class EmailSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='auth_user.email')

    class Meta:
        model = Profile
        fields = ['email']

class CoincidenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coincidencia
        fields = ['id', 'profile', 'mascota']

class ProfileCoincidenciaSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='auth_user.email', read_only=True)
    comuna = ComunaSerializer()

    class Meta:
        model = Profile
        fields = ['id', 'rut', 'nombre_apellido', 'telefono', 'fecha_nacimiento', 'domicilio', 'comuna', 'foto_perfil', 'email']
        read_only_fields = ['region_id', 'email']

class CoincidenciaProfileSerializer(serializers.ModelSerializer):
    profile = ProfileCoincidenciaSerializer(read_only=True)

    class Meta:
        model = Coincidencia
        fields = ['id', 'profile', 'mascota']

class CoincidenciaMascotaSerializer(serializers.ModelSerializer):
    mascota = MascotaSerializer(read_only=True)

    class Meta:
        model = Coincidencia
        fields = ['id', 'profile', 'mascota']

""" Serializador Adopcion """
class AdopcionesSerializer(serializers.ModelSerializer):

    class Meta:
        model = Adopciones
        fields = ['id', 'fecha', 'coincidencia']
        

class EventoSerializer(serializers.ModelSerializer):
    nombre_responsable = serializers.ReadOnlyField()
    nombre_sucursal = serializers.ReadOnlyField()

    class Meta:
        model = Evento
        fields = '__all__'