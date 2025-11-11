import { Component } from '@angular/core';

@Component({
  selector: 'app-popup-google',
  standalone: true,
  imports: [],
  templateUrl: './popup-google.component.html',
  styleUrl: './popup-google.component.css'
})
export class PopupGoogleComponent {

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.replace('#', ''));
        const token = params.get('access_token');
        if (token) {
          // Enviar el token a la ventana principal y cerrar la ventana emergente
          window.opener.postMessage({ token }, window.location.origin);
          window.close();
        }
      }
    }
  }
}
