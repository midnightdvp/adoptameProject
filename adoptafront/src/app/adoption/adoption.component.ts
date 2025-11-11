import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { NavstyComponent } from '../navsty/navsty.component';
import { ApiService } from '../services/api.service';
import { NavigationEnd, Router, Event } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { EmailService } from '../services/email.service';
import { profile } from 'node:console';
import { StorageService } from '../services/storage.service';

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
}

@Component({
  selector: 'app-adoption',
  standalone: true,
  imports: [NavstyComponent, CommonModule],
  templateUrl: './adoption.component.html',
  styleUrls: ['./adoption.component.css']
})
export class AdoptionComponent implements OnInit {
  isGato = false;
  isPerro = false;
  noRelevanteEspecie = false;
  noRelevanteSexo = false;
  isMacho = false;
  isHembra = false;
  alta = false;
  media = false;
  baja = false;
  edadOp = false;
  siTratamiento = false;
  noTrataniento = false;
  textToShow: string = '';
  siSociable = false;
  noSociable = false;
  siEsteril = false;
  noEsteril = false;
  color = false;
  patron = false;
  displayMatchs = false;
  colorSelected: string = '';
  patronSelected: string = '';
  isModalOpen = false;
  selectedPet: any = null;
  isImageLarge = false;
  questReady = false;
  noPetFound = false;
  mailOFF = "adoptameorg@gmail.com";
  @ViewChild('divNorStyle', { static: false }) divNorStyle!: ElementRef;
  ageRanges = [
    { rangeName: "Rango Baja", min: 17, max: 20 },
    { rangeName: "Rango Media baja", min: 13, max: 17 },
    { rangeName: "Rango Sub media", min: 5, max: 9 },
    { rangeName: "Rango Media", min: 9, max: 13 },
    { rangeName: "Rango Media alta", min: 3, max: 5 },
    { rangeName: "Rango Alta", min: 0, max: 3 }
  ];
  matches: any[] = [];

  selectedRange: string | null = null;
  selectedACT: string | null = null;
  agesInRange: number[] = [];

  ages = [0.1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  colors = [
    'Blanco',
    'Negro',
    'Marrón',
    'Gris',
    'Naranja',
    'Crema',
    'Dorado',
    'Gris azulado'
  ];
  patterns = [
    'Unicolor',
    'Bicolor',
    'Tricolor',
    'Atigrado',
    'Merle',
    'Manchado',
    'Jaspeado',
    'Tordo'
  ];

  todasLasMascotas: Mascota[] = [];
  mascotasFiltradas: Mascota[] = [];
  constructor(private apiService: ApiService, private router: Router, private cdr: ChangeDetectorRef, private emailService: EmailService, private storageService: StorageService) {
    // Suscribirse al evento NavigationEnd para detectar cambios de ruta
    this.router.events.pipe(
      filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      if (event.urlAfterRedirects === '/adoption') {
        this.updateText();
      }
    });
  }
  ngOnInit(): void {
    this.cargarTodasLasMascotas();
    this.updateText();
    this.filtrarMascotas()
  }
  ngAfterViewInit() {
    this.updateText();
  }
  refreshPage(): void {
    window.location.reload();
  }
  setCoincidence(petId: number) {
    const idUser = localStorage.getItem('user');
    console.log('usuario', idUser, 'mascota', petId);
    alert('Enviando solicitud...');

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
  }
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
  updateText() {
    if (!(this.displayMatchs) && !(this.questReady)) {
      this.cdr.detectChanges();
      const cardText = document.getElementById("typedtext") as HTMLElement;
      const buttons = document.querySelectorAll(".btn") as NodeListOf<HTMLButtonElement>;
      // Deshabilitar botones al iniciar la animación
      buttons.forEach(button => {
        button.disabled = true;
      });
      // Verificar si el elemento existe
      if (!cardText) {
        console.error('Elemento "typedtext" no encontrado en el DOM.');
        return;
      }
      let textToShow = '';
      // Texto a mostrar según las condiciones
      if ((!this.isGato && !this.isPerro && !this.noRelevanteEspecie && !this.noRelevanteSexo && !this.isMacho && !this.isHembra)) {
        textToShow = "Para comenzar... ¿Qué especie te interesa?";
      } else if ((this.isPerro || this.isGato || this.noRelevanteEspecie) && (!this.isMacho && !this.isHembra && !this.noRelevanteSexo)) {
        textToShow = `Mmm... ya veo... ¿Qué sexo te interesa para tu ${this.isGato ? 'gato' : this.isPerro ? 'perro' : 'mascota'} ideal?`;
      } else if ((this.isPerro || this.isGato || this.noRelevanteEspecie) && (this.isMacho || this.isHembra || this.noRelevanteSexo) && (!this.alta && !this.media && !this.baja)) {
        textToShow = `¿Qué tipo de actividad te gustaría que tenga tu  ${this.isGato ? 'futuro gato' : this.isPerro ? 'futuro perro' : 'futura mascota'}?`;
      } else if ((this.isPerro || this.isGato || this.noRelevanteEspecie) && (this.isMacho || this.isHembra || this.noRelevanteSexo) && (this.alta || this.media || this.baja) && (!this.edadOp)) {
        textToShow = "¿Qué rango de edad se acopla más a tus gustos?";
      } else if ((this.isPerro || this.isGato || this.noRelevanteEspecie) && (this.isMacho || this.isHembra || this.noRelevanteSexo) && (this.alta || this.media || this.baja) && (this.edadOp) && !(this.siTratamiento || this.noTrataniento)) {
        textToShow = "Hay algo que me interesa en particular... \n¿Tendrías el tiempo suficiente para ocuparte de los cuidados de tu mascota si requiere seguir un tratamiento médico?";
      } else if ((this.isPerro || this.isGato || this.noRelevanteEspecie) && (this.isMacho || this.isHembra || this.noRelevanteSexo) && (this.alta || this.media || this.baja) && (this.edadOp) && (this.siTratamiento || this.noTrataniento) && !(this.siSociable || this.noSociable)) {
        textToShow = "Muy bien... otra duda \n ¿Ya tienes otras Mascotas en tu hogar?";
      } else if ((this.isPerro || this.isGato || this.noRelevanteEspecie) && (this.isMacho || this.isHembra || this.noRelevanteSexo) && (this.alta || this.media || this.baja) && (this.edadOp) && (this.siTratamiento || this.noTrataniento) && (this.siSociable || this.noSociable) && !(this.siEsteril || this.noEsteril)) {
        textToShow = "¿Te gustaría que tu futura mascota estuviera esterilizada?";
      } else if ((this.isPerro || this.isGato || this.noRelevanteEspecie) && (this.isMacho || this.isHembra || this.noRelevanteSexo) && (this.alta || this.media || this.baja) && (this.edadOp) && (this.siTratamiento || this.noTrataniento) && (this.siSociable || this.noSociable) && (this.siEsteril || this.noEsteril) && !(this.color)) {
        textToShow = `¿Que color te gustaria para el pelaje de tu ${this.isGato ? 'gato' : this.isPerro ? 'perro' : 'mascota'}?`;
      } else if ((this.isPerro || this.isGato || this.noRelevanteEspecie) && (this.isMacho || this.isHembra || this.noRelevanteSexo) && (this.alta || this.media || this.baja) && (this.edadOp) && (this.siTratamiento || this.noTrataniento) && (this.siSociable || this.noSociable) && (this.siEsteril || this.noEsteril) && (this.color) && !(this.patron)) {
        textToShow = `¿Que patron de color te gustaria que tenga el pelaje de tu ${this.isGato ? 'gato' : this.isPerro ? 'perro' : 'mascota'}?`;
      }
      // Iniciar animación
      let i = 0;
      const interval = setInterval(() => {
        cardText.innerHTML = textToShow.substring(0, i) + '_';
        i++;
        if (i > textToShow.length) {
          clearInterval(interval);
          cardText.innerHTML = textToShow; // Quitar el cursor parpadeante
          // Habilitar botones al finalizar la animación
          buttons.forEach(button => {
            button.disabled = false;
          });
        }
      }, 28);
    } else if (this.displayMatchs && this.questReady) {
      console.log('HolaBaken')
    }
  }

  /* Método para cargar todas las mascotas */
  cargarTodasLasMascotas() {
    this.apiService.getAllPet().subscribe(
      (data: Mascota[]) => {
        this.todasLasMascotas = data;
        console.log('Todas las mascotas:', this.todasLasMascotas);
      },
      (error) => {
        console.error('Error al obtener las mascotas:', error);
      }
    );
  }
  /* Metodo para navegar hacia atras en el oraculo */
  back() {
    if (this.isGato && !(this.isMacho || this.isHembra || this.noRelevanteSexo)) {
      this.isGato = false;
    }
    if (this.isPerro && !(this.isMacho || this.isHembra || this.noRelevanteSexo)) {
      this.isPerro = false;
    }
    if (this.noRelevanteEspecie && !(this.isMacho || this.isHembra || this.noRelevanteSexo)) {
      this.noRelevanteEspecie = false;
    }
    if ((this.isGato || this.isPerro || this.noRelevanteEspecie) && this.isMacho && !(this.alta || this.media || this.baja)) {
      this.isMacho = false;
    }
    if ((this.isGato || this.isPerro || this.noRelevanteEspecie) && this.isHembra && !(this.alta || this.media || this.baja)) {
      this.isHembra = false;
    }
    if ((this.isGato || this.isPerro || this.noRelevanteEspecie) && this.noRelevanteSexo && !(this.alta || this.media || this.baja)) {
      this.noRelevanteSexo = false;
    }
    if ((this.isGato || this.isPerro || this.noRelevanteEspecie) && (this.isMacho || this.isHembra || this.noRelevanteSexo) && (this.alta || this.media || this.baja) && !(this.edadOp)) {
      if (this.baja) {
        this.baja = false;
      }
      if (this.media) {
        this.media = false;
      }
      if (this.alta) {
        this.alta = false;
      }
      this.divNorStyle.nativeElement.className = 'row  btn-cont';
    }
    if ((this.isGato || this.isPerro || this.noRelevanteEspecie) && (this.isMacho || this.isHembra || this.noRelevanteSexo) && (this.alta || this.media || this.baja) && (this.edadOp) && !(this.siTratamiento || this.noTrataniento)) {
      this.edadOp = false;
      this.divNorStyle.nativeElement.className = 'row  btnColors';
      console.log('Aqui wn')                 
    }
    if (this.siTratamiento && (this.isGato || this.isPerro || this.noRelevanteEspecie) && (this.isMacho || this.isHembra || this.noRelevanteSexo) && (this.alta || this.media || this.baja) && (this.edadOp) && !(this.siSociable || this.noSociable)) {
      this.siTratamiento = false;
    }
    if (this.noTrataniento && (this.isGato || this.isPerro || this.noRelevanteEspecie) && (this.isMacho || this.isHembra || this.noRelevanteSexo) && (this.alta || this.media || this.baja) && (this.edadOp) && !(this.siSociable || this.noSociable)) {
      this.noTrataniento = false;
    }
    if (this.siSociable && (this.isGato || this.isPerro || this.noRelevanteEspecie) && (this.isMacho || this.isHembra || this.noRelevanteSexo) && (this.alta || this.media || this.baja) && (this.edadOp) && (this.siTratamiento || this.noTrataniento) && !(this.siEsteril || this.noEsteril)) {
      this.siSociable = false;
    }
    if (this.noSociable && (this.isGato || this.isPerro || this.noRelevanteEspecie) && (this.isMacho || this.isHembra || this.noRelevanteSexo) && (this.alta || this.media || this.baja) && (this.edadOp) && (this.siTratamiento || this.noTrataniento) && !(this.siEsteril || this.noEsteril)) {
      this.noSociable = false;
    }
    if (this.siEsteril && (this.isGato || this.isPerro || this.noRelevanteEspecie) && (this.isMacho || this.isHembra || this.noRelevanteSexo) && (this.alta || this.media || this.baja) && (this.edadOp) && (this.siTratamiento || this.noTrataniento) && (this.siSociable || this.noSociable) && !(this.color)) {
      this.siEsteril = false;
    }
    if (this.noEsteril && (this.isGato || this.isPerro || this.noRelevanteEspecie) && (this.isMacho || this.isHembra || this.noRelevanteSexo) && (this.alta || this.media || this.baja) && (this.edadOp) && (this.siTratamiento || this.noTrataniento) && (this.siSociable || this.noSociable) && !(this.color)) {
      this.noEsteril = false;
    }
    if (this.color && (this.siEsteril || this.noEsteril) && (this.isGato || this.isPerro || this.noRelevanteEspecie) && (this.isMacho || this.isHembra || this.noRelevanteSexo) && (this.alta || this.media || this.baja) && (this.edadOp) && (this.siTratamiento || this.noTrataniento) && (this.siSociable || this.noSociable)) {
      this.color = false;
    }
    if (this.patron && this.color && (this.siEsteril || this.noEsteril) && (this.isGato || this.isPerro || this.noRelevanteEspecie) && (this.isMacho || this.isHembra || this.noRelevanteSexo) && (this.alta || this.media || this.baja) && (this.edadOp) && (this.siTratamiento || this.noTrataniento) && (this.siSociable || this.noSociable)) {
      this.patron = false;
    }
    /* if(!(this.edadOp) && (this.isGato || this.isPerro || this.noRelevanteEspecie)){
      this.divNorStyle.nativeElement.className = 'row  btnColors';
    } */
    if (!(this.siEsteril || this.noEsteril) && this.edadOp && !(this.baja || this.media || this.alta)) {
      this.divNorStyle.nativeElement.className = 'row btn-cont';
    }
    this.updateText();
  }
  /* Método para aplicar filtros a las mascotas */
  filtrarMascotas() {
    this.mascotasFiltradas = this.todasLasMascotas;
    // Filtro por especie
    if (this.isGato) {
      this.mascotasFiltradas = this.mascotasFiltradas.filter(mascota => mascota.especie_id === 2); // 2 para gatos
    }
    if (this.isPerro) {
      this.mascotasFiltradas = this.mascotasFiltradas.filter(mascota => mascota.especie_id === 1); // 1 para perros
    }
    // Filtro por sexo
    if (this.isMacho) {
      this.mascotasFiltradas = this.mascotasFiltradas.filter(mascota => mascota.sexo === 'Macho');
    }
    if (this.isHembra) {
      this.mascotasFiltradas = this.mascotasFiltradas.filter(mascota => mascota.sexo === 'Hembra');
    }
    // Filtro por actividad
    if (this.selectedACT) {
      this.mascotasFiltradas = this.mascotasFiltradas.filter(mascota => mascota.actividad === this.selectedACT);
    }
    if (this.selectedRange) {
      const selectedRangeObj = this.ageRanges.find(range => range.rangeName === this.selectedRange);
      if (selectedRangeObj) {
        const minAge = selectedRangeObj.min;
        const maxAge = selectedRangeObj.max;
        this.mascotasFiltradas = this.mascotasFiltradas.filter(mascota => {
          const age = this.calculateAge(mascota.fecha_nacimiento);
          return age >= minAge && age <= maxAge;
        });
      }
    }
    /* Filtros por Tratamiento */
    if (this.noTrataniento) {
      this.mascotasFiltradas = this.mascotasFiltradas.filter(mascota => mascota.tratamiento === false);
    }
    /* Filtros por ser sociable (si no es necesario que sea social no filtra y nos devuelve las que si y no lo son (Todas) ) */
    if (this.siSociable) {
      this.mascotasFiltradas = this.mascotasFiltradas.filter(mascota => mascota.sociable === this.siSociable);
    }
    /* Filtros Esteril */
    if (this.siEsteril) {
      this.mascotasFiltradas = this.mascotasFiltradas.filter(mascota => mascota.esterilizado === this.siEsteril);
    }
    if (this.noEsteril) {
      this.mascotasFiltradas = this.mascotasFiltradas.filter(mascota => mascota.esterilizado === false);
    }
    /* Filtro Color */
    if (this.color) {
      this.mascotasFiltradas = this.mascotasFiltradas.filter(mascota => mascota.color === this.colorSelected);
    }
    /* Filtro Patron */
    if (this.patron) {
      this.mascotasFiltradas = this.mascotasFiltradas.filter(mascota => mascota.patron === this.patronSelected);
    }
    // Conteo de mascotas filtradas
    const conteoMascotas = this.mascotasFiltradas.length;
    console.log(conteoMascotas)
    if (conteoMascotas === 0 && (this.patron)) {
      this.noPetFound = true;
    }
    console.log('Mascotas filtradas:', this.mascotasFiltradas);
  }
  calculateAge(fecha_nacimiento: Date): number {
    const birthDate = new Date(fecha_nacimiento);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  gatoOPT(isGato: boolean) {
    this.isGato = isGato;
    this.updateText();
    console.log("Es Gato: " + this.isGato)
    this.filtrarMascotas();
  }
  perroOPT(isPerro: boolean) {
    this.isPerro = isPerro;
    this.updateText();
    console.log("Es Perro: " + this.isPerro)
    this.filtrarMascotas();
  }
  machoOPT(isMacho: boolean) {
    this.isMacho = isMacho;
    this.updateText();
    console.log("Es Macho: " + this.isMacho)
    this.filtrarMascotas();
  }
  hembraOPT(isHembra: boolean) {
    this.isHembra = isHembra;
    this.updateText();
    console.log("Es Hembra: " + this.isHembra)
    this.filtrarMascotas();
  }
  noRelevanteEspecieOPT(isNoRelevante: boolean) {
    this.noRelevanteEspecie = isNoRelevante;
    this.updateText();
    console.log("No relevante: " + this.noRelevanteEspecie)
  }
  noRelevanteSexoOPT(isNoRelevante: boolean) {
    this.noRelevanteSexo = isNoRelevante;
    this.updateText();
    console.log("No relevante: " + this.noRelevanteSexo)
  }
  selectACT(activName: string): void {
    this.selectedACT = activName;
    if (this.selectedACT === "Baja") {
      this.baja = true;
      this.updateText();
      this.filtrarMascotas();
    } else if (this.selectedACT === "Media") {
      this.media = true;
      this.updateText();
      this.filtrarMascotas();
    } else if (this.selectedACT === "Alta") {
      this.alta = true;
      this.updateText();
      this.filtrarMascotas();
      console.log("Es alta: " + this.alta + " Es media: " + this.media + " Es baja: " + this.baja)
    }
    if ((this.alta || this.media || this.baja) && this.edadOp === false) {
      this.divNorStyle.nativeElement.className = 'row  btnColors';
    }
  }
  /*----------Filtrar por rango de edad----------*/
  selectRange(rangeName: string): void {
    this.selectedRange = rangeName;
    this.edadOp = true;
    this.divNorStyle.nativeElement.className = 'row btn-cont';
    this.updateText();
    this.agesInRange = []; // Reiniciar las edades dentro del rango
    console.log(this.selectedRange);
    const selectedRangeObj = this.ageRanges.find(range => range.rangeName === this.selectedRange);
    if (selectedRangeObj) {
      this.agesInRange = this.ages.filter(age => age >= selectedRangeObj.min && age <= selectedRangeObj.max);
      console.log(`Rango seleccionado: ${this.selectedRange}`);
      console.log(`Edades dentro del rango: ${this.agesInRange.join(', ')}`);
      if (this.agesInRange.length > 0) {
        const minAge = Math.min(...this.agesInRange);
        const maxAge = Math.max(...this.agesInRange);
        const minDate = calculateDateYearsAgo(minAge);
        const maxDate = calculateDateYearsAgo(maxAge);
        console.log(`Fecha mínima: ${minDate.toISOString().split('T')[0]}`);
        console.log(`Fecha máxima: ${maxDate.toISOString().split('T')[0]}`);
      }
    }
    this.filtrarMascotas();
  }
  isTratamiento(isTratamiento: boolean) {
    this.siTratamiento = isTratamiento;
    this.updateText();
    this.filtrarMascotas();
    console.log("Requiere tratamiento: " + this.siTratamiento)
  }
  isTratamientoNor(isTratamientoNor: boolean) {
    this.noTrataniento = isTratamientoNor;
    this.updateText();
    this.filtrarMascotas();
    console.log("No requiere tratamiento: " + this.noTrataniento)
  }
  isSociable(isSociable: boolean) {
    this.siSociable = isSociable;
    this.updateText();
    this.filtrarMascotas();
    console.log("Debe ser sociable: " + this.siSociable)
  }
  isSociableNor(isSociableNor: boolean) {
    this.noSociable = isSociableNor;
    this.updateText();
    this.filtrarMascotas();
    console.log("Puede no ser o si ser sociable" + this.noSociable)
  }
  isEsteril(isEsteril: boolean) {
    this.siEsteril = isEsteril;
    this.updateText();
    this.filtrarMascotas();
    if (this.color === false) {
      this.divNorStyle.nativeElement.className = 'row  btnColors';
    }
    console.log("Debe ser esteril: " + this.siEsteril)
  }
  isEsterilNor(isEsterilNor: boolean) {
    this.noEsteril = isEsterilNor;
    this.updateText();
    this.filtrarMascotas();
    if (this.color === false && this.patron === false) {
      this.divNorStyle.nativeElement.className = 'row  btnColors';
    }
    console.log("Debe ser esteril: " + this.siEsteril)
  }
  thisColor(color: string) {
    this.colorSelected = color;
    this.color = true;
    this.updateText();
    this.filtrarMascotas();
    console.log("Color: " + this.colorSelected)
  }
  thisPatron(patron: string) {
    this.patronSelected = patron;
    this.patron = true;
    this.matchScreen(this.patron);
    this.updateText();
    this.filtrarMascotas();
    console.log("Patron: " + this.patron)
  }
  matchScreen(matchMoment: boolean) {
    this.displayMatchs = matchMoment;
    console.log("Coincidencias " + this.displayMatchs)
  }
  // modals
  openPetDetailModal(pet: any): void {
    this.selectedPet = pet;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }
  toggleImageSize(): void {
    this.isImageLarge = !this.isImageLarge;
    const imageElement = document.querySelector('.thumbnail') as HTMLElement;
    if (this.isImageLarge) {
      imageElement.classList.add('large');
    } else {
      imageElement.classList.remove('large');
    }
  }
  copyText(): void {
    const emailTextElement = document.getElementById("emailText");
    if (emailTextElement) {
      const emailText = emailTextElement.innerText;
      navigator.clipboard.writeText(emailText).then(() => {
        alert('Texto copiado al portapapeles');
      }).catch(err => {
        console.error('Error al copiar el texto: ', err);
      });
    } else {
      console.error('El elemento emailText no se encontró en el DOM.');
    }
  }

  volverAtras() {
    // Reiniciar todas las variables a su estado inicial
    this.isGato = false;
    this.isPerro = false;
    this.noRelevanteEspecie = false;
    this.noRelevanteSexo = false;
    this.isMacho = false;
    this.isHembra = false;
    this.alta = false;
    this.media = false;
    this.baja = false;
    this.edadOp = false;
    this.siTratamiento = false;
    this.noTrataniento = false;
    this.siSociable = false;
    this.noSociable = false;
    this.siEsteril = false;
    this.noEsteril = false;
    this.color = false;
    this.patron = false;
    this.selectedRange = null;
    this.selectedACT = null;
    this.agesInRange = [];
    this.colorSelected = '';
    this.patronSelected = '';
    this.displayMatchs = false;
    this.questReady = false;
    this.noPetFound = false;

    // Reiniciar el texto y los filtros
    this.updateText();
    this.filtrarMascotas();
  }
}
// Función para calcular una fecha exacta restando una cantidad de años desde la fecha actual
function calculateDateYearsAgo(years: number): Date {
  const currentDate = new Date();
  currentDate.setFullYear(currentDate.getFullYear() - years);
  console.log(`Calculando fecha para ${years} años atrás: ${currentDate.toISOString().split('T')[0]}`);
  return currentDate;
}

