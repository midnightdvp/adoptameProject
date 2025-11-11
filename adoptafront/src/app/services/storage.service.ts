import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() { }

  // Métodos para manejar el almacenamiento de tokens
  setAccess(access: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('accessToken', access);
    }
  }

  getAccessToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  }

  setRefresh(refresh: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('refreshToken', refresh);
    }
  }

  getRefreshToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('refreshToken');
    }
    return null;
  }

  // Métodos para manejar el almacenamiento de los detalles del usuario
  setUserId(user: any): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  getUserId(): any {
    if (typeof localStorage !== 'undefined') {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  // Métodos para manejar el almacenamiento del rol del usuario
  setUserRole(rol: string): void {
    if (typeof localStorage !== 'undefined') {
    localStorage.setItem('user_rol', rol);
    }
  }

  getUserRole(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('user_rol');
    }
    return null;
  }

  clearLocalStorage(): void {
    localStorage.clear();
  }

}
