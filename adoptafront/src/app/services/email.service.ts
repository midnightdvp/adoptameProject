import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private apiUrl = 'http://localhost:8080/send-email';

  constructor(private http: HttpClient) {}

  sendEmail(emails: string[], subject: string, htmlMessage: string, plainMessage: string,): Observable<any> {
    const body = { emails, subject, html_message: htmlMessage, message: plainMessage};
    return this.http.post(this.apiUrl, body);
  }
}
