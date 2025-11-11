import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../services/api.service';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  token: string | null = null;
  isLoading: boolean = false;

  constructor(private router: Router, private apiService: ApiService, private storageService: StorageService, private route: ActivatedRoute) { }

  ngOnInit(): void {
    // Obtén el token de los parámetros de la URL al inicializar el componente
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || null;
      if (this.token) {
        // Aquí puedes usar el token como necesites
        this.handleGoogleToken(this.token);
        this.token = null;
      }
    });
  }

  handleGoogleToken(token: string): void {
    if (!token) {
      console.error('Token de Google no proporcionado.');
      return;
    }
    this.isLoading = true; 
    this.apiService.getGoogleUserInfo(token).subscribe(
      (googleUser) => {
        const googleId = googleUser.id; // Asegúrate de obtener el ID correcto del usuario

        // Pasar el googleId correctamente
        this.apiService.loginWithGoogleId(googleId).subscribe(
          (response) => {
            console.log('Inicio de sesión exitoso:', response);
            // Guardar tokens, detalles del usuario, ID y rol en localStorage
            this.storageService.setAccess(response.tokens.access);
            this.storageService.setRefresh(response.tokens.refresh);
            this.storageService.setUserId(response.user.id); // Asegúrate de acceder correctamente al ID del usuario
            this.storageService.setUserRole(response.user.rol); // Asegúrate de acceder correctamente al rol

            // Asegúrate de acceder correctamente al rol
            this.storageService.setUserRole(response.user.rol);

            // Retrasar la redirección 3 segundos para mostrar la animación de carga
            setTimeout(() => {
            // Obtener el rol almacenado
            const userRole = this.storageService.getUserRole(); // Asume que tienes un método getUserRole()

            // Redirigir según el rol del usuario
            if (userRole === 'adoptante') {
              this.router.navigateByUrl('adoption');
            } else if (userRole === 'organizacion') {
              this.router.navigateByUrl('landing-organization');
            } else {
              // Redirigir a una página por defecto si el rol no coincide
              this.router.navigateByUrl('adoption');
            }
            this.isLoading = false;
          }, 1000); 
          },
          (error) => {
            console.error('Error al iniciar sesión:', error);
            this.isLoading = false;
          }
        );
      },
      (error) => {
        console.error('Error al obtener la información del usuario de Google:', error);
        this.isLoading = false;
      }
    );
  }

  navigateToURL(url: string): void {
    this.router.navigateByUrl(url);
  }
}
