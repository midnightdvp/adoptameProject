from django.urls import path
from .views import *
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # Usuario y Perfil
    path("register/", UserRegistrationAPIView.as_view(), name="register-user"),
    path("register-details/", ProfileCreateAPIView.as_view(), name="register-details"),

    path("validate-user/", UserValidationAPIView.as_view(), name="validate-user"),
    path('login/google/', LoginWithGoogleIDAPIView.as_view(), name='login_with_google_id'),
    path("logout/", UserLogoutAPIView.as_view(), name="logout-user"),

    path("account/", UserProfileAPIView.as_view(), name="account-user"),
    path('user-details/<int:user_id>/', UserDetailsView.as_view(), name='user-details'),
    path('update-user/', UpdateUserAPIView.as_view(), name='update-user'),
    path('update-profile/<int:profile_id>', UpdateProfileAPIView.as_view(), name='update-profile'),

    path("token-refresh/", TokenRefreshView.as_view(), name="token-refresh"),

    # Region y Comuna
    path("region/", RegionListAPIView.as_view(), name="region"),
    path("comuna/region/<int:region_id>/", ComunaListAPIView.as_view(), name="comuna"),

    # Administracion
    path('organizaciones/', OrganizacionListView.as_view(), name='organizacion-list'),
    path('organizaciones-create/', OrganizacionCreateView.as_view(), name='organizacion-create'),
    path('organizaciones/<int:pk>/', OrganizacionDetailView.as_view(), name='organizacion-detail'),
    path('organizaciones/<int:pk>/update/', OrganizacionUpdateView.as_view(), name='organizacion-update'),
    path('organizaciones/<int:pk>/delete/', OrganizacionDeleteView.as_view(), name='organizacion-delete'),
    #Sucursal
    path('sucursales/', SucursalListCreateView.as_view(), name='sucursal-list-create'),
    path('sucursales/<int:pk>/', SucursalDetailView.as_view(), name='sucursal-detail'),
    path('sucursales-organizacion/<int:organizacion_id>/', SucursalOrganizacionView.as_view(), name='sucursal-organizacion'),
    path('sucursales/<int:pk>/update/', SucursalUpdateView.as_view(), name='sucursal-organizacion-update'),
    path('sucursales/<int:pk>/delete/', SucursalDeleteView.as_view(), name='sucursal-organizacion-delete'),
    # Usuarios Organizacion
    path("user-organizacion/",UserOrganizacionCreateView.as_view(), name="user-organizacion"),
    path("user-organizacion-list/<int:sucursal_id>/",UserOrganizacionListView.as_view(), name="user-organizacion-list"),
    path("user-organizacion/<int:pk>/delete/",UserOrganizacionDeleteView.as_view(), name="user-organizacion-delete"),
    path("user-organizacion-obtener/", UserOrganizacionView.as_view(), name="user-organizacion-obtener"),
    path('user-sucursal-organizacion/<int:profile_id>/', SucursalOrganizacionProfileView.as_view(), name='sucursal-organizacion-profile'),

    # Especies y Razas
    path('especies/', EspecieListView.as_view(), name='especie-list'),
    path('razas/', RazaListView.as_view(), name='raza-list'),
    path('razas/especie/<int:especie_id>/', RazaListView.as_view(), name='raza-by-especie-list'),
    # Mascotas
    path('mascotas/create/', MascotaCreateView.as_view(), name='mascota-create'),
    path('mascotas/', MascotaListView.as_view(), name='mascota-list'),
    path('mascotas/organizacion/<int:sucursal_id>/', MascotaPorOrganizacionListView.as_view(), name='mascotas-por-organizacion'),
    path('mascotas/<int:pk>/', MascotaDetailView.as_view(), name='mascota-detail'),
    path('mascotas/update/<int:pk>/', MascotaUpdateView.as_view(), name='mascota-update'),
    path('mascotas/delete/<int:pk>/', MascotaDeleteView.as_view(), name='mascota-delete'),
    # Estado de la mascota
    path('estados/create/', EstadoMascotaCreateView.as_view(), name='estado-mascota-create'),
    path('estados/mascotas/<int:mascota_id>/', EstadoMascotaDetailView.as_view(), name='estado-by-mascota-list'),
    path('estados/mascotas/update/<int:mascota_id>/', EstadoMascotaUpdateView.as_view(), name='update-estado-mascota'),
    path('mascotas/organizacion/<int:organizacion_id>/', MascotaPorOrganizacionListView.as_view(), name='mascotas-por-organizacion'),
    
    # Coincidencias
    path('coincidencia-create/', CoincidenciaCreateView.as_view(), name='coincidencia-create'),
    path('coincidencia-mascota/<int:mascota_id>/', CoincidenciaPorMascotaDetailView.as_view(), name='coincidencia-mascota'),
    path('coincidencia-usuario/<int:profile_id>/', CoincidenciaPorProfileDetailView.as_view(), name='coincidencia-usuario'),
    path('emails-sucursal/<int:mascota_id>/', EmailsPorMascotaView.as_view(), name='emails-sucursal'),
    path('coincidencias-delete/<int:pk>/', CoincidenciaDeleteView.as_view(), name='coincidencia-delete'),
    
    # Adopciones
    path('adopcion-create/', AdopcionesCreateView.as_view(), name='adopcion-create'),
    # Sistema de Alerta
    path('eventos/', EventoListView.as_view(), name='eventos-list'),
    path('eventos/<int:pk>/', EventoDetailView.as_view(), name='evento-detail'),
    path('eventos/create/', EventoCreateView.as_view(), name='eventos-create'),
    path('eventos/update/<int:pk>/', EventoUpdateView.as_view(), name='eventos-update'),
    path('eventos/by-sucursal/', EventoListBySucursalView.as_view(), name='eventos-by-sucursal'),
]
