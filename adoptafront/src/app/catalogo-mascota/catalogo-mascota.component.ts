import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { NavstyComponent } from '../navsty/navsty.component';
import { BehaviorSubject } from 'rxjs';
import { EmailService } from '../services/email.service';

export interface Mascota {
  id: number;
  imagen?: string;
  microchip: string;
  nombre: string;
  fecha_nacimiento: Date;
  sexo: string;
  color: string;
  patron: string;
  esterilizado: boolean;
  sociable: boolean;
  tratamiento: boolean;
  tratamientoDescripcion?: string;
  actividad: string;
  vacunas: boolean;
  descripcion?: string;
  raza: number;
  especie_id: number;
  estado: string;
  nombreEspecie: string;
  nombreRaza: string;
}

@Component({
  selector: 'app-catalogo-mascota',
  standalone: true,
  imports: [CommonModule, NavstyComponent],
  templateUrl: './catalogo-mascota.component.html',
  styleUrl: './catalogo-mascota.component.css'
})
export class CatalogoMascotaComponent {
  /* Mascota */
  todasLasMascotas: Mascota[] = [];
  showMascota: boolean = false;
  selectedMascota: any;

  /* Emails */
  questReady = false;

  /* Filtros */
  filtroEspecie: number | null = null;
  filteredMascotas: Mascota[] = [];

  /* Paginacion */
  currentPage: number = 1;
  itemsPerPage: number = 12;

  /* Observable */
  coincSubject = new BehaviorSubject<Mascota[]>([]);

  constructor(
    private router: Router,
    private apiService: ApiService,
    private emailService: EmailService
  ) { }

  ngOnInit(): void {
    this.loadPets();
  }

  /* Generar coincidencia */
  setCoincidence(petId: number) {
    const idUser = localStorage.getItem('user');
    console.log('usuario', idUser, 'mascota', petId);
  
    // Preguntar al usuario si está seguro de enviar la solicitud
    const confirmed = confirm('¿Está seguro de que desea enviar la solicitud?');
  
    if (confirmed) {
      const coincidencia = {
        profile: idUser,
        mascota: petId,
      };
  
      this.apiService.setCoincidense(coincidencia).subscribe(
        response => {
          this.sendEmail(petId);
  
          const estado = {
            estado: 'Pendiente'
          };
  
          this.apiService.updateEstado(petId, estado).subscribe(
            response => {
              // Mostrar la alerta
              alert('Solicitud enviada');
              // Redirigir a la página de coincidencias
              this.router.navigate(['/coincidence']);
            },
            error => {
              console.error('Error al actualizar estado mascota:', error);
            }
          );
        },
        error => {
          console.error('Error al crear la coincidencia:', error);
        }
      );
    } else {
      // El usuario canceló la acción
      console.log('El usuario canceló el envío de la solicitud');
    }
  }  

  /* enviar correos */
  sendEmail(petId: number) {
    /* Emails organizacion */
    this.apiService.getEmailsSucursal(petId).subscribe(
      (data: { email: string }[]) => {
        const emails = data.map(user => user.email);
        console.log('Correos electrónicos obtenidos:', emails);

        const htmlTemplate = `
            <header style="background-image: url('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDA ... '); background-position: center center; background-size: cover; height: 100vh; width: 100vw; display: flex; justify-content: center; align-items: center; text-align: center;">
              <div class="container">
                <div class="row align-items-center">
                  <div class="col-md-5 p-5 mb-5 mt-5">
                    <h1 style="font-size: 4rem; padding: 15px; font-weight: 700;">¡Adopta.Me!</h1>
                    <p style="font-size: 2rem; font-weight: 600;">Un usuario quiere adoptar una mascota..<br> Ya tienes acceso al correo de la persona en tu gestor de mascotas. </p>
                  </div>
                </div>
              </div>
            </header>
          `;
        const plainMessage = 'Mensaje si HTML no es compatible'; // Mensaje si el HTML no es soportado

        this.emailService.sendEmail(emails, 'Asunto del Correo', htmlTemplate, plainMessage)
          .subscribe(
            response => {
              console.log('Correo enviado exitosamente', response);
              this.questReady = true;
            },
            error => {
              console.error('Error al enviar el correo', error);
              // Loguear el mensaje específico de error
              if (error.error instanceof ErrorEvent) {
                console.error('Error del lado del cliente:', error.error.message);
              } else {
                console.error('Error del lado del servidor:', error);
              }
            }
          );
      },
      (error: any) => {
        console.error('Error al cargar el perfil del usuario:', error);
      }
    );
    /* Email usuario */
    this.apiService.accountUser().subscribe(
      (data: any) => {
        const emailUser = data.profile.email
        console.log('Datos del usuario:', emailUser);

        const emails = [emailUser];
        const htmlTemplate = `
            <header style="background-image: url('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDA ... '); background-position: center center; background-size: cover; height: 100vh; width: 100vw; display: flex; justify-content: center; align-items: center; text-align: center;">
              <div class="container">
                <div class="row align-items-center">
                  <div class="col-md-5 p-5 mb-5 mt-5">
                    <h1 style="font-size: 4rem; padding: 15px; font-weight: 700;">¡Adopta.Me!</h1>
                    <p style="font-size: 2rem; font-weight: 600;">Felicidades, eres uno de los candidatos de adopción para la mascota escogida :D!! <br> Quédate atento a tu correo, se estarán comunicando contigo!!</p>
                  </div>
                </div>
              </div>
            </header>
          `;
        const plainMessage = 'Mensaje si HTML no es compatible'; // Mensaje si el HTML no es soportado

        this.emailService.sendEmail(emails, 'Asunto del Correo', htmlTemplate, plainMessage)
          .subscribe(
            response => {
              console.log('Correo enviado exitosamente', response);
            },
            error => {
              console.error('Error al enviar el correo', error);
              // Loguear el mensaje específico de error
              if (error.error instanceof ErrorEvent) {
                console.error('Error del lado del cliente:', error.error.message);
              } else {
                console.error('Error del lado del servidor:', error);
              }
            }
          );
      },
      (error: any) => {
        console.error('Error al cargar el perfil del usuario:', error);
      }
    );
  }

  /* Cargar mascotas */
  loadPets() {
    this.apiService.getAllPet().subscribe(
      (data: Mascota[]) => {
        // Ordenar las mascotas por ID en orden descendente
        this.todasLasMascotas = data.sort((a, b) => b.id - a.id);
        this.applyFilters();
      },
      (error) => {
        console.error('Error al obtener las mascotas:', error);
      }
    );
  }

  /* Método para aplicar los filtros */
  get totalPages(): number {
    return Math.ceil(this.filteredMascotas.length / this.itemsPerPage);
  }

  applyFilters() {
    this.filteredMascotas = this.todasLasMascotas;

    if (this.filtroEspecie !== null) {
      this.filteredMascotas = this.filteredMascotas.filter(mascota => mascota.especie_id === this.filtroEspecie);
    }

    // Actualizar el observable con las mascotas filtradas
    this.coincSubject.next(this.filteredMascotas);
    this.currentPage = 1; // Resetear a la primera página después de aplicar filtros
  }

  // Método para actualizar el filtro de especie
  updateEspecieFilter(event: Event) {
    const especieId = (event.target as HTMLSelectElement).value;
    this.filtroEspecie = especieId === "null" ? null : parseInt(especieId, 10);
    this.applyFilters();
  }

  /* Paginacion */
  get paginatedMascotas() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredMascotas.slice(startIndex, endIndex);
  }

  nextPage() {
    if ((this.currentPage * this.itemsPerPage) < this.filteredMascotas.length) {
      this.currentPage++;
      window.scrollTo(0, 0); // Desplazar a la parte superior
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      window.scrollTo(0, 0); // Desplazar a la parte superior
    }
  }

  /* Modals */
  openModal(mascota: any) {
    this.selectedMascota = mascota;
    this.showMascota = true;
  }

  closeModal() {
    this.showMascota = false;
    this.selectedMascota = null;
  }

}
