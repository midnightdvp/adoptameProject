import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { CommonModule } from '@angular/common';
import { NavstyComponent } from '../navsty/navsty.component';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-coincidence',
  standalone: true,
  imports: [CommonModule, NavstyComponent],
  templateUrl: './coincidence.component.html',
  styleUrl: './coincidence.component.css'
})
export class CoincidenceComponent {

  coincidences: any[] = [];
  showMascota: boolean = false;
  selectedMascota: any;

  /* Observable */
  coincSubject = new BehaviorSubject<any[]>([]);

  constructor(
    private apiService: ApiService
  ) { }

  ngOnInit(): void {
    this.loadCoincidence();
    this.coincSubject.subscribe(data => {
      this.coincidences = data;
    });

  }

  loadCoincidence() {
    const idUser = localStorage.getItem('user');
    if (idUser) {
      this.apiService.getCoincidenceByUser(Number(idUser)).subscribe(
        (data) => {
          this.coincidences = data;
          this.coincSubject.next(data);
          console.log(data)
        },
        (error) => {
          console.error('Error al cargar coincidencias:', error);
        }
      );
    } else {
      console.error('No se encontró el ID de usuario en el localStorage.');
    }
  }

  deleteCoincidence(petId: number, coincidenceId: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta coincidencia?')) {
      const updatedState = {
        estado: 'Disponible'
      };

      this.apiService.updateEstado(petId, updatedState).subscribe(
        (response: any) => {
          console.log('Estado de la mascota actualizado a Disponible: ', response);

          this.apiService.deleteCoincidence(coincidenceId).subscribe(
            (response: any) => {
              console.log('Coincidencia eliminada: ', response);
              this.coincidences = this.coincidences.filter(c => c.id !== coincidenceId);
              this.coincSubject.next(this.coincidences); // Actualizar el BehaviorSubject
            },

            (error: any) => {
              console.error('Error al eliminar la coincidencia: ', error);
            }
          );
          
        },
        (error: any) => {
          console.error('Error al actualizar el estado de la mascota: ', error);
        }
      );
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
