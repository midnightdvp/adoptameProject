import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { NavstyComponent } from '../navsty/navsty.component';

@Component({
  selector: 'app-lading-organization',
  standalone: true,
  imports: [NavstyComponent],
  templateUrl: './lading-organization.component.html',
  styleUrl: './lading-organization.component.css'
})
export class LadingOrganizationComponent {
  sucursalData: any;
  organizacionData: any;

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    if (typeof localStorage !== 'undefined') {
      const idUser = localStorage.getItem('user');
      
      if (idUser) {
        const idUserNumber = parseInt(idUser, 10);
        this.apiService.getSucursalUser(idUserNumber).subscribe(
          (data: any) => {
            if (data.length > 0) {
              // Asignar los datos del primer elemento del array
              this.sucursalData = data[0];
              this.organizacionData = data[0].organizacion;
              console.log('Datos de la sucursal:', this.sucursalData);
              console.log('Datos de la organización:', this.organizacionData);
            } else {
              console.error('No se encontraron datos de sucursal y organización.');
            }
          },
          error => {
            console.error('Error al obtener datos de la sucursal y organización:', error);
          }
        );
      } else {
        console.error('No se encontró la ID de la organización en el Local Storage.');
      }
    }
  }

}