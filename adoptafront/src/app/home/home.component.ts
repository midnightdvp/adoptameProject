import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  showModalIn: boolean = false;
  showModalUp: boolean = false;
  token: string | null = null;
  popup: Window | null = null;
  popupInterval: number | null = null;

  constructor(private router: Router, private apiService: ApiService) { }

  ngOnInit(): void {
    // Verificar si window está definido (para entornos donde no está disponible)
    if (typeof window !== 'undefined') {
      // Agregar event listener para recibir mensajes de la ventana emergente
      window.addEventListener('message', this.receiveMessage.bind(this), false);
    }
  }

  // Método para iniciar el proceso de autenticación con Google
  validateGoogle() {
    const redirectUri = window.location.origin + '/popup-google';
  
    // Generar la URL de autorización de Google con prompt: 'select_account'
    const authUrl = this.apiService.generateGoogleAuthUrl(redirectUri, { prompt: 'select_account' });
  
    if (typeof window !== 'undefined') {
      // Abrir una nueva ventana emergente para la autenticación de Google
      this.popup = window.open(authUrl, 'popup-google', 'width=600,height=600');
  
      if (this.popup) {
        // Iniciar un intervalo para verificar si la ventana emergente ha sido cerrada o redirigida a access_denied
        this.popupInterval = window.setInterval(() => {
          if (this.popup) {
            if (this.popup.closed) {
              // Si la ventana emergente está cerrada, limpiar el intervalo y cerrar el modal
              window.clearInterval(this.popupInterval!);
              this.popupInterval = null;
              this.closeModalIn();
            } else {
              try {
                const url = this.popup.location.href;
                if (url.includes('access_denied')) {
                  // Si se redirige a access_denied, cerrar la ventana y el modal
                  this.popup.close();
                  this.handleGoogleCancel();
                }
              } catch (error) {
                // No hacer nada si hay un error de CORS
              }
            }
          }
        }, 500); // Verificar cada 500 ms
      } else {
        console.error('No se pudo abrir la ventana emergente.');
      }
    }
  }

  // Método para recibir el mensaje desde la ventana emergente
  receiveMessage(event: MessageEvent) {
    if (event.origin !== window.location.origin) {
      return;
    }

    const data = event.data;
    if (data.token) {
      this.handleGoogleToken(data.token);
    } else if (data.cancelled) {
      // Manejar el caso cuando el usuario cancela el inicio de sesión
      this.handleGoogleCancel();
    }
  }

  // Método para manejar el token de Google después de la autenticación
  handleGoogleToken(token: string): void {
    console.log('Manejando el token de Google...');
    this.apiService.getGoogleUserInfo(token).subscribe(
      (googleUser) => {
        const userEmail = googleUser.email;

        // Validar si el usuario existe en tu backend
        this.apiService.validateUser(userEmail).subscribe(
          response => {
            if (response.email_exists) {
              // Usuario registrado, redirigir a la página de la aplicación
              this.router.navigate(['/login'], { queryParams: { token: token } });
            }
          },
          error => {
            if (error) {
              // Usuario no registrado, redirigir a la página de registro
              this.router.navigate(['/signup'], { queryParams: { token: token } });
            } else {
              console.error('Error al validar usuario:', error);
            }
          }
        );
      },
      (error) => {
        console.error('Error al obtener la información del usuario de Google:', error);
      }
    );
  }

  // Método para manejar el cancel de Google
  handleGoogleCancel(): void {
    console.log('Inicio de sesión cancelado.');
    this.closeModalIn();
  }

  /* Modals */
  openModalIn() {
    this.showModalIn = true;
  }

  closeModalIn() {
    this.showModalIn = false;
  }

  openModalUp() {
    this.showModalUp = true;
  }

  closeModalUp() {
    this.showModalUp = false;
  }
}
