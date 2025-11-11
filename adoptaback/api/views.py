from django.shortcuts import render
from .serializers import *
from rest_framework.generics import GenericAPIView, CreateAPIView, ListAPIView, UpdateAPIView, RetrieveAPIView, DestroyAPIView
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import update_session_auth_hash
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework import status, generics
from .models import *

""" Validar usuario """
class UserValidationAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            user_profile = user.profile
            return Response({
                'email_exists': {
                    'profile_id': user_profile.id,
                    'rol': user_profile.rol  # Asume que el campo 'rol' está en el perfil del usuario
                }
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'User with this email does not exist.'}, status=status.HTTP_404_NOT_FOUND)
    
""" Registro de usuario """
class UserRegistrationAPIView(GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = UserRegisterSerializer
    def post(self, request, *args, **kwargs):
        serializers = self.get_serializer(data=request.data)
        serializers.is_valid(raise_exception=True)
        user = serializers.save()
        token = RefreshToken.for_user(user)
        data = serializers.data
        data["tokens"] = {"refresh":str(token),"access":str(token.access_token)}
        return Response(data, status = status.HTTP_201_CREATED)

class ProfileCreateAPIView(CreateAPIView):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        profile = serializer.save(auth_user=self.request.user)
        return profile

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response({'id': profile.id}, status=status.HTTP_201_CREATED, headers=headers)
        
""" Login y Logout """
class LoginWithGoogleIDAPIView(GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProfileSerializer

    def post(self, request, *args, **kwargs):
        google_id = request.data.get('google_id')
        if not google_id:
            return Response({'error': 'Google ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            profile = Profile.objects.get(google_id=google_id)
            user = profile.auth_user  # Corrigiendo para usar 'auth_user'

            refresh = RefreshToken.for_user(user)
            access = refresh.access_token

            response_data = {
                'tokens': {
                    'access': str(access),
                    'refresh': str(refresh),
                },
                'user': {
                    'id': profile.id,
                    'email': user.email,
                    'username': user.username,
                    'google_id': profile.google_id,
                    'rol': profile.rol,
                }
            }

            return Response(response_data, status=status.HTTP_200_OK)

        except Profile.DoesNotExist:
            return Response({'error': 'Profile with this Google ID does not exist'}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            import traceback
            return Response({'error': str(e), 'trace': traceback.format_exc()}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class UserLogoutAPIView(GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(status = status.HTTP_400_BAD_REQUEST)

""" Obtener al usuario """
class UserProfileAPIView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    user_serializer_class = CustomUserSerializer
    profile_serializer_class = ProfileSerializer

    def get(self, request, *args, **kwargs):
        user = request.user
        user_serializer = self.user_serializer_class(user)

        try:
            profile = Profile.objects.get(auth_user=user)
            profile_serializer = self.profile_serializer_class(profile)
            return Response({
                "user": user_serializer.data,
                "profile": profile_serializer.data
            }, status=status.HTTP_200_OK)
        except Profile.DoesNotExist:
            return Response("Profile not found for this user", status=status.HTTP_404_NOT_FOUND)

class UserDetailsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id, *args, **kwargs):
        try:
            profile = Profile.objects.get(auth_user__id=user_id)
            serializer = ProfileSerializer(profile)
            return Response(serializer.data, status=200)
        except Profile.DoesNotExist:
            return Response({'error': 'Profile not found'}, status=404)
            
""" Modificar usuario """
class UpdateUserAPIView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CustomUserSerializer

    def patch(self, request, *args, **kwargs):
        user = request.user
        data = request.data

        # Validar contraseña actual
        if 'email' in data or 'phone' in data or 'password2' in data:
            password = data.get('password1')
            if not password or not user.check_password(password):
                return Response({"detail": "Current password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)

        # Actualizar contraseña
        if 'password2' in data:
            new_password = data['password2']
            user.set_password(new_password)
            update_session_auth_hash(request, user)

        serializer = self.get_serializer(user, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)

    def perform_update(self, serializer):
        serializer.save()

""" Modificar perfil de usuario """
class UpdateProfileAPIView(UpdateAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProfileSerializer

    def get_object(self):
        profile_id = self.kwargs.get('profile_id')
        try:
            return Profile.objects.get(id=profile_id)
        except Profile.DoesNotExist:
            raise serializers.ValidationError("Profile with this ID does not exist.")

    def patch(self, request, *args, **kwargs):
        instance = self.get_object()
        data = {}

        # Verificar si el nombre y apellido están presentes en los datos de la solicitud
        if 'nombre_apellido' in request.data:
            data['nombre_apellido'] = request.data['nombre_apellido']
        # Verificar si el telefono está presente en los datos de la solicitud   
        if 'telefono' in request.data:
            data['telefono'] = request.data['telefono']

        # Verificar si la comuna está presente en los datos de la solicitud
        if 'comuna' in request.data:
            data['comuna'] = request.data['comuna']

        # Verificar si la dirección está presente en los datos de la solicitud
        if 'domicilio' in request.data:
            data['domicilio'] = request.data['domicilio']

        # Verificar si la imagen está presente en los datos de la solicitud
        if 'foto_perfil' in request.data:
            data['foto_perfil'] = request.data['foto_perfil']
        
        # Verificar rol
        if 'rol' in request.data:
            data['rol'] = request.data['rol']

        # Instanciar el serializador con los datos y actualizar el perfil
        serializer = self.get_serializer(instance, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Retornar una respuesta con los datos actualizados
        return Response(serializer.data, status=status.HTTP_200_OK)

""" Obtener Region y Comuna """
class RegionListAPIView(ListAPIView):
    queryset = Region.objects.all()
    serializer_class = RegionSerializer
    permission_classes = [AllowAny]

class ComunaListAPIView(ListAPIView):
    serializer_class = ComunaSerializer
    permission_classes = [AllowAny]
    def get_queryset(self):
        region_id = self.kwargs.get('region_id')
        if region_id:
            return Comuna.objects.filter(region_id=region_id)
        return Comuna.objects.all()

""" Vistas para organizacion """
# Crear
class OrganizacionCreateView(CreateAPIView):
    queryset = Organizacion.objects.all()
    serializer_class = OrganizacionSerializer
    permission_classes = [AllowAny]

# Listar
class OrganizacionListView(ListAPIView):
    queryset = Organizacion.objects.all()
    serializer_class = OrganizacionSerializer
    permission_classes = [AllowAny]

class OrganizacionDetailView(RetrieveAPIView):
    queryset = Organizacion.objects.all()
    serializer_class = OrganizacionSerializer
    permission_classes = [AllowAny]

# Modificar
class OrganizacionUpdateView(UpdateAPIView):
    queryset = Organizacion.objects.all()
    serializer_class = OrganizacionSerializer
    permission_classes = [AllowAny]

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)

# Eliminar
class OrganizacionDeleteView(DestroyAPIView):
    queryset = Organizacion.objects.all()
    serializer_class = OrganizacionSerializer
    permission_classes = [AllowAny]

""" Sucursal """
# Crear
class SucursalListCreateView(generics.ListCreateAPIView):
    queryset = Sucursal.objects.all()
    serializer_class = SucursalSerializer
    permission_classes = [AllowAny]

# Listar
class SucursalDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Sucursal.objects.all()
    serializer_class = SucursalSerializer
    permission_classes = [AllowAny]

class SucursalOrganizacionView(generics.ListAPIView):
    serializer_class = SucursalSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        organizacion_id = self.kwargs['organizacion_id']
        return Sucursal.objects.filter(organizacion_id=organizacion_id)
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class SucursalOrganizacionProfileView(generics.ListAPIView):
    serializer_class = SucursalOrganizacionSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        # Obtener el ID del perfil de usuario desde los parámetros de la URL
        profile_id = self.kwargs['profile_id']
        
        # Obtener las sucursales asociadas al perfil de usuario a través de UserOrganizacion
        user_organizaciones = UserOrganizacion.objects.filter(usuario_id=profile_id)
        
        # Obtener IDs de sucursales asociadas al perfil
        sucursal_ids = user_organizaciones.values_list('sucursal_id', flat=True)
        
        # Filtrar las sucursales por las sucursales asociadas al perfil de usuario
        queryset = Sucursal.objects.filter(id__in=sucursal_ids).select_related('organizacion')
        
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
# Modificar
class SucursalUpdateView(UpdateAPIView):
    queryset = Sucursal.objects.all()
    serializer_class = SucursalSerializer
    permission_classes = [AllowAny]

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)
    
# ELiminar
class SucursalDeleteView(DestroyAPIView):
    queryset = Sucursal.objects.all()
    serializer_class = SucursalSerializer
    permission_classes = [AllowAny]

""" Vincular usuario y organizacion """
class UserOrganizacionCreateView(CreateAPIView):
    queryset = UserOrganizacion.objects.all()
    serializer_class = UserOrganizacionSerializer
    permission_classes = [AllowAny]

class UserOrganizacionListView(ListAPIView):
    serializer_class = UserOrganizacionSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        sucursal_id = self.kwargs.get('sucursal_id')
        queryset = UserOrganizacion.objects.filter(sucursal_id=sucursal_id)
        return queryset
    
class UserOrganizacionView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Aquí obtienes el usuario autenticado a partir del request
            user = request.user
            # Luego, obtienes la relación UserOrganizacion asociada a ese usuario
            user_organizacion = UserOrganizacion.objects.get(usuario=user.profile)
            # Serializas la información
            serializer = UserOrganizacionSerializer(user_organizacion)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except UserOrganizacion.DoesNotExist:
            return Response({"message": "El usuario no tiene asociada una organización."}, status=status.HTTP_404_NOT_FOUND)
    
class UserOrganizacionDeleteView(generics.DestroyAPIView):
    queryset = UserOrganizacion.objects.all()
    serializer_class = UserOrganizacionSerializer
    permission_classes = [AllowAny]

    def delete(self, request, *args, **kwargs):
        instance = self.get_object()
        profile = instance.usuario
        user = profile.auth_user
        
        # Delete UserOrganizacion instance
        self.perform_destroy(instance)
        
        # Delete Profile and User instances
        profile.delete()
        user.delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)
    
""" Especie y raza """
class EspecieListView(ListAPIView):
    queryset = EspecieMascota.objects.all()
    serializer_class = EspecieSerializer
    permission_classes = [AllowAny]

class RazaListView(ListAPIView):
    queryset = RazaMascota.objects.all()
    serializer_class = RazaSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        especie_id = self.kwargs.get('especie_id')
        if especie_id:
            return RazaMascota.objects.filter(especie=especie_id)
        return RazaMascota.objects.all()

""" Mascotas """
class MascotaCreateView(CreateAPIView):
    queryset = Mascota.objects.all()
    serializer_class = MascotaSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        serializer.save()

class MascotaListView(ListAPIView):
    queryset = Mascota.objects.all()
    serializer_class = MascotaSerializer
    permission_classes = [AllowAny]
    def get_queryset(self):
        return Mascota.objects.filter(estado__estado= "Disponible")

class MascotaPorOrganizacionListView(ListAPIView):
    serializer_class = MascotaSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        sucursal_id = self.kwargs.get('sucursal_id')
        if sucursal_id:
            return Mascota.objects.filter(estado__sucursal_id=sucursal_id)
        return Mascota.objects.all()

class MascotaDetailView(RetrieveAPIView):
    queryset = Mascota.objects.all()
    serializer_class = MascotaSerializer
    permission_classes = [AllowAny]

class MascotaUpdateView(UpdateAPIView):
    queryset = Mascota.objects.all()
    serializer_class = MascotaSerializer
    permission_classes = [AllowAny]

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().partial_update(request, *args, **kwargs)

class MascotaDeleteView(DestroyAPIView):
    queryset = Mascota.objects.all()
    serializer_class = MascotaSerializer
    permission_classes = [AllowAny]

""" Estado mascota """
class EstadoMascotaCreateView(CreateAPIView):
    queryset = EstadoMascota.objects.all()
    serializer_class = EstadoMascotaSerializador
    permission_classes = [AllowAny]

class EstadoMascotaDetailView(ListAPIView):
    serializer_class = EstadoMascotaSerializador
    permission_classes = [AllowAny]

    def get_queryset(self):
        mascota_id = self.kwargs['mascota_id']
        return EstadoMascota.objects.filter(mascota_id=mascota_id)
    
class EstadoMascotaUpdateView(UpdateAPIView):
    queryset = EstadoMascota.objects.all()
    serializer_class = EstadoMascotaSerializador
    permission_classes = [AllowAny]
    lookup_url_kwarg = 'mascota_id'  # Nombre del parámetro en la URL

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()  # Guardar la instancia actualizada

        return Response(serializer.data, status=status.HTTP_200_OK)
    
""" Coincidencias """
# Crear
class CoincidenciaCreateView(generics.CreateAPIView):
    queryset = Coincidencia.objects.all()
    serializer_class = CoincidenciaSerializer
    permission_classes = [AllowAny]

# Leer
class CoincidenciaPorProfileDetailView(generics.ListAPIView):
    serializer_class = CoincidenciaMascotaSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        profile_id = self.kwargs['profile_id']
        return Coincidencia.objects.filter(profile_id=profile_id)
    
class CoincidenciaPorMascotaDetailView(ListAPIView):
    serializer_class = CoincidenciaProfileSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        mascota_id = self.kwargs['mascota_id']
        return Coincidencia.objects.filter(mascota_id=mascota_id)
    
class EmailsPorMascotaView(generics.ListAPIView):
    serializer_class = EmailSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        mascota_id = self.kwargs['mascota_id']
        
        # Filtrar el estado de la mascota para obtener la sucursal
        estado_mascota = EstadoMascota.objects.filter(mascota_id=mascota_id).first()
        if estado_mascota:
            sucursal_id = estado_mascota.sucursal_id
            
            # Obtener usuarios de la sucursal
            usuarios_sucursal = UserOrganizacion.objects.filter(sucursal_id=sucursal_id).values_list('usuario_id', flat=True)
            
            # Filtrar perfiles de los usuarios de la sucursal
            return Profile.objects.filter(id__in=usuarios_sucursal)
        
        return Profile.objects.none()

# Modificar

# Eliminar
class CoincidenciaDeleteView(generics.DestroyAPIView):
    queryset = Coincidencia.objects.all()
    serializer_class = CoincidenciaSerializer
    permission_classes = [AllowAny]

""" Adopciones """
# Crear
class AdopcionesCreateView(generics.CreateAPIView):
    queryset = Adopciones.objects.all()
    serializer_class = AdopcionesSerializer
    permission_classes = [AllowAny]

# Leer
    
# Modificar

# Eliminar
""" Alertas """
# Crear
# Crear
class EventoCreateView(generics.CreateAPIView):
    def post(self, request, *args, **kwargs):
        serializer = EventoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

# Listar, Imprimir, Mostrar
class EventoListView(generics.ListAPIView):
    serializer_class = EventoSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        profile = Profile.objects.get(auth_user=user)
        sucursales = UserOrganizacion.objects.filter(usuario=profile).values_list('sucursal', flat=True)
        comuna_ids = Sucursal.objects.filter(id__in=sucursales).values_list('comuna', flat=True)

        # Filtrar eventos por comuna de las sucursales del usuario y los eventos creados por el usuario
        eventos = Evento.objects.filter(comuna__in=comuna_ids, activo=True) | \
                    Evento.objects.filter(mailUserReportante=user.email, activo=True) | \
                    Evento.objects.filter(mailUserReportante=user.email, activo=False, sucursal = 'Sin Respuesta', IdSucursal__isnull=True) |\
                    Evento.objects.filter(sucursal__isnull=True, IdSucursal__isnull=True, activo=True)

        serializer = EventoSerializer(eventos.distinct(), many=True)
        return Response(serializer.data, status=200)
class EventoDetailView(generics.RetrieveAPIView):
    queryset = Evento.objects.all()
    serializer_class = EventoSerializer
    permission_classes = [IsAuthenticated]
# Actualizar
class EventoUpdateView(generics.UpdateAPIView):
    queryset = Evento.objects.all()
    serializer_class = EventoSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['patch']


#reports
class EventoListBySucursalView(generics.ListAPIView):
    serializer_class = EventoSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        sucursal_id = self.request.query_params.get('sucursal_id')        
        if sucursal_id:
            return Evento.objects.filter(IdSucursal=sucursal_id)
        return Evento.objects.none()