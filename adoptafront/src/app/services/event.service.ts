import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  private apiUrl = 'http://localhost:8000/api/eventos/';

  constructor(private http: HttpClient, private storageService: StorageService) { }
  
  getEventById(id: number): Observable<any> {
    const accessToken = this.storageService.getAccessToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`);
    return this.http.get(`${this.apiUrl}${id}/`, { headers });
  }
  getActiveEvents(): Observable<any> {
    const accessToken = this.storageService.getAccessToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`);
    return this.http.get(this.apiUrl, { headers });
  }

  createEvent(event: any): Observable<any> {
    const accessToken = this.storageService.getAccessToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`);
    return this.http.post(this.apiUrl + 'create/', event, { headers });
  }

  updateEvent(id: number, event: any): Observable<any> {
    const accessToken = this.storageService.getAccessToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`);
    return this.http.patch(`${this.apiUrl}update/${id}/`, event, { headers });
  }
}
