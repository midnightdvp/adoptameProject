import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, timer, BehaviorSubject  } from 'rxjs';
import { StorageService } from './storage.service';
import { switchMap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private apiUrl = 'http://127.0.0.1:8000/api/';

  private clientId = '476035747804-j0i47ss2bihor646g1qaucu58pcva6je.apps.googleusercontent.com';

  private refreshTokenInterval = 5 * 60 * 1000; /* Actualizar cada 5 minutos */


  constructor(private http: HttpClient, private storageService: StorageService) { 
    if (this.storageService.getAccessToken()) {
      this.startTokenRefreshTimer();
    }
  }
  
  /* Mantener el token actualizado para las peticiones del usuario */
  private startTokenRefreshTimer(): void {
    timer(0, this.refreshTokenInterval).pipe(
      switchMap(() => this.refreshToken())
    ).subscribe(
      newAccessToken => {
        this.storageService.setAccess(newAccessToken); // Actualiza el token en el almacenamiento
      },
      error => {
        console.error('Error refreshing token:', error);
      }
    );
  }

  private refreshToken(): Observable<string> {
    const refreshToken = this.storageService.getRefreshToken(); // Obtener el refresh token almacenado
    const url = `${this.apiUrl}token-refresh/`; // URL para refrescar el token en tu backend

    return this.http.post<any>(url, { refresh: refreshToken }).pipe(
      map(response => response.access) // Obtener el nuevo token de acceso desde la respuesta
    );
  }

  /* Google */
  generateGoogleAuthUrl(redirectUri: string, options?: { prompt?: string }): string {
    const scope = encodeURIComponent('email profile');
    let url = `https://accounts.google.com/o/oauth2/auth?client_id=${this.clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}`;
  
    // Agregar prompt si se proporciona en las opciones
    if (options && options.prompt) {
      url += `&prompt=${options.prompt}`;
    }
  
    return url;
  }
  getGoogleUserInfo(token: string) {
    return this.http.get<any>(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${token}`);
  }
  validateUser(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}validate-user/`, { email });
  }

  /* Métodos para registar usuario */
  registerUser(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}register/`, userData);
  }

  registerUserDetails(details: any, token: string): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<any>(`${this.apiUrl}register-details/`, details, { headers });
  }

  /* Métodos para inicias sesion y cerrar session */
  loginWithGoogleId(googleId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}login/google/`, { google_id: googleId });
  }

  logoutUser(): Observable<any> {
    const refreshToken = this.storageService.getRefreshToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${refreshToken}`);
    return this.http.post<any>(`${this.apiUrl}logout/`, { headers });
  }

  /* Método para obtener cuenta de usuario */
  accountUser(): Observable<any> {
    const accessToken = this.storageService.getAccessToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`);
    return this.http.get<any>(`${this.apiUrl}account/`, { headers });
  }

  getUserDetails(userId: number): Observable<any> {
    const accessToken = this.storageService.getAccessToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`);
    return this.http.get(`${this.apiUrl}user-details/${userId}/`, { headers });
  }
  /* Métodos modificar usuario y perfil */
  updateUser(data: any): Observable<any> {
    const accessToken = this.storageService.getAccessToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`);
    return this.http.patch<any>(`${this.apiUrl}update-user/`, data, { headers });
  }
  updateProfile(profileId: number, profileData: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}update-profile/${profileId}`, profileData);
  }

  /* Traer regiones y comunas */
  getRegions(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}region/`);
  }
  getCommunes(region: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}comuna/region/${region}/`);
  }

  /*----------Métodos para organizacion----------*/

  /* Registrar organizaciones */
  registerOrganization(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}organizaciones-create/`, data);
  }
  /* Obtener organizaciones */
  getOrganizations(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}organizaciones/`);
  }
  /* Obtener organización por id */
  getOrganizationById(organizationId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}organizaciones/${organizationId}/`);
  }
  /* Actualizar organizaciones */
  updateOrganization(organizationId: number, formData: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}organizaciones/${organizationId}/update/`, formData);
  }
  /* Borrar Organizaciones */
  deleteOrganization(organizationId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}organizaciones/${organizationId}/delete/`);
  }
  /* Registrar sucursales */
  sucursalOrganization(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}sucursales/`, data);
  }
  /* Actualizar sucursal */
  updateSucursal(sucursal_id: number, formData: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}sucursales/${sucursal_id}/update/`, formData);
  }
  /* Eliminar sucursal */
  deleteSucursal(sucursal_id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}sucursales/${sucursal_id}/delete/`);
  }
  /* Obtener sucursal por id */
  getSucursalById(sucursal_id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}sucursales/${sucursal_id}/`);
  }
  /*---------- Obtener sucursal organización ----------*/
  getSucursalOrganization(organizacion_id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}sucursales-organizacion/${organizacion_id}/`);
  }
  /* Registrar usuario organización */
  userOrganization(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}user-organizacion/`, data);
  }
  /*---------- Obtener usuario organización ----------*/
  getUsersOrganization(sucursal_id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}user-organizacion-list/${sucursal_id}/`);
  }
  /* Borrar usuario organización */
  deleteUser(userOrganizacionId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}user-organizacion/${userOrganizacionId}/delete/`);
  }
  /* Obtener id organización usuario */
  getIdOrganizationUser(): Observable<any> {
    const accessToken = this.storageService.getAccessToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`);
    return this.http.get<any>(`${this.apiUrl}user-organizacion-obtener/`, { headers });
  }

  getSucursalUser(profile_id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}user-sucursal-organizacion/${profile_id}/`);
  }

  /*----------Métodos para Mascotas----------*/
  /* Registro de mascota y estado */
  registerMascota(form: any): Observable<any> {
    return this.http.post(`${this.apiUrl}mascotas/create/`, form);
  }
  registerEstado(form: any): Observable<any> {
    return this.http.post(`${this.apiUrl}estados/create/`, form);
  }
  /* Obtener mascotas */
  getAllPet(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}mascotas/`);
  }
  /* Obtener mascota por organización */
  getPetOrganization(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}mascotas/organizacion/${id}/`);
  }
  /* Obtener Mascota */
  getPet(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}mascotas/${id}/`);
  }
  /* Obtener Estado de la mascota */
  getPetEstado(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}estados/mascotas/${id}/`);
  }
  /* Actualizar mascotas */
  updatePet(id: number, formData: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}mascotas/update/${id}/`, formData);
  }
  /* Actualizar mascotas */
  updateEstado(id: number, formData: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}estados/mascotas/update/${id}/`, formData);
  }
  /* Eliminar mascota */
  deletePet(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}mascotas/delete/${id}/`);
  }
  /* Especies */
  getEspecies(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}especies/`);
  }
  /* Razas por especies */
  getRazasPorEspecie(especie: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}razas/especie/${especie}/`);
  }

  getPetsByOrganization(organizationId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}mascotas/organizacion/${organizationId}/`);
  }

  /*---------- Coincidencias ----------*/
  /* Crear */
  setCoincidense(matches: any):Observable<any>{
    return this.http.post<any>(`${this.apiUrl}coincidencia-create/`, matches);
  }
  /* Listar */
  getCoincidenceByPet(mascotaId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}coincidencia-mascota/${mascotaId}/`)
  }

  getCoincidenceByUser(userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}coincidencia-usuario/${userId}/`)
  }

  getEmailsSucursal(mascotaId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}emails-sucursal/${mascotaId}/`)
  }
  /* Modificar */

  /* Eliminar */
  deleteCoincidence(coincidenceId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}coincidencias-delete/${coincidenceId}/`).pipe(
    );
  }
  
  /*---------- Adopciones ----------*/

  /* Crear */
  setAdoption(adoption: any):Observable<any>{
    return this.http.post<any>(`${this.apiUrl}adopcion-create/`, adoption);
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.storageService.getAccessToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
  
  getEventos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}eventos/`, { headers: this.getAuthHeaders() });
  }  

  getEventosAlternative(sucursalIdUser: number): Observable<any> {
    const accessToken = this.storageService.getAccessToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`);
    return this.http.get(`${this.apiUrl}eventos/by-sucursal/?sucursal_id=${sucursalIdUser}`, { headers });
  }

}