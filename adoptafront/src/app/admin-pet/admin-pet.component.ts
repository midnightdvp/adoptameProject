import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavstyComponent } from '../navsty/navsty.component';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { FormGroup, FormBuilder, FormsModule, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { EmailService } from '../services/email.service';
import { StorageService } from '../services/storage.service';


@Component({
  selector: 'app-admin-pet',
  standalone: true,
  imports: [CommonModule, NavstyComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-pet.component.html',
  styleUrls: ['./admin-pet.component.css']
})
export class AdminPetComponent implements OnInit {
  pets: any[] = [];
  filteredPets: any[] = [];
  searchPet = '';
  profileImageUrl: string | ArrayBuffer | null = null;
  userId: any;
  organizationIdUser: any;
  idPet: any;
  petSelected: any;
  petCount: number = 0;

  reports: any[] = [];

  especies: any[] = [];
  razas: any[] = [];

  coincidence: any = null;
  adoption: any = null;
  currentPets: any[] = [];
  sucursalData: any;
  organizacionData: any;

  /* Formumlarios Mascota */
  signupPet: FormGroup;
  modPetForm: FormGroup;

  /* Emails */
  questReady = false;

  /* Observable */
  petsSubject = new BehaviorSubject<any[]>([]);

  petGenders = [
    { id: 'Macho', nombre: 'Macho' },
    { id: 'Hembra', nombre: 'Hembra' }
  ];
  petColor = [
    { id: 'Blanco', nombre: 'Blanco' },
    { id: 'Negro', nombre: 'Negro' },
    { id: 'Marrón', nombre: 'Marrón' },
    { id: 'Gris', nombre: 'Gris' },
    { id: 'Naranja', nombre: 'Naranja' },
    { id: 'Crema', nombre: 'Crema' },
    { id: 'Dorado', nombre: 'Dorado' },
    { id: 'Gris azulado', nombre: 'Gris azulado' },
  ];
  petPatron = [
    { id: 'Unicolor', nombre: 'Unicolor' },
    { id: 'Bicolor', nombre: 'Bicolor' },
    { id: 'Tricolor', nombre: 'Tricolor' },
    { id: 'Atigrado', nombre: 'Atigrado' },
    { id: 'Merle', nombre: 'Merle' },
    { id: 'Manchado', nombre: 'Manchado' },
    { id: 'Jaspeado', nombre: 'Jaspeado' },
    { id: 'Tordo', nombre: 'Tordo' },
  ];
  petEsterilizado = [
    { id: true, nombre: 'Sí' },
    { id: false, nombre: 'No' }
  ];
  petActividad = [
    { id: 'Alta', nombre: 'Alta' },
    { id: 'Media', nombre: 'Media' },
    { id: 'Baja', nombre: 'Baja' }
  ];
  petSociable = [
    { id: true, nombre: 'Sí' },
    { id: false, nombre: 'No' }
  ];
  petTratamiento = [
    { id: true, nombre: 'Sí' },
    { id: false, nombre: 'No' }
  ];
  petVacunas = [
    { id: true, nombre: 'Sí' },
    { id: false, nombre: 'No' }
  ];
  petEstado = [
    { nombre: 'Disponible' },
    { nombre: 'Adoptado' }
  ];

  /* Modals */
  isModalOpen = false;
  isPetModalOpen = false;
  isPetEditModalOpen = false;
  isPetDetallesModalOpen = false;
  isProfileDetallesModalOpen: boolean = false;

  currentTable: string = 'pets';
  selectedTable: string = '';

  sucursalDataId: any;

  adoptedPetCount: number = 0;
  pendingApplicationCount: number = 0;

  maxDate: string;

  constructor(private formBuilder: FormBuilder, private router: Router, private apiService: ApiService, private emailService: EmailService, private storageService: StorageService) {
    const today = new Date();
    this.maxDate = today.toISOString().split('T')[0];

    /* Formulario registro mascota */
    this.signupPet = this.formBuilder.group({
      photo: [null, Validators.required],
      microchip: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      namePet: ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')]],
      dateNac: ['', [Validators.required, this.dateNot]],
      gender: ['', [Validators.required]],
      color: ['', [Validators.required]],
      patron: ['', [Validators.required]],
      esterilizado: ['', [Validators.required]],
      actividad: ['', [Validators.required]],
      vacunas: ['', [Validators.required]],
      sociable: [false],
      tratamiento: [false],
      detalleTratamiento: [''],
      description: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ,.\\n]+$'),
      Validators.maxLength(150)]],
      raza: ['', [Validators.required]],
      especie: ['', [Validators.required]],
      organizacion: [''],
      estado: ['Disponible'],
      fecha: ['']
    });

    /* Formulario modificar mascota */
    this.modPetForm = this.formBuilder.group({
      photo: [null, Validators.required],
      microchip: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      namePet: ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')]],
      dateNac: ['', [Validators.required, this.dateNot]],
      gender: ['', [Validators.required]],
      color: ['', [Validators.required]],
      patron: ['', [Validators.required]],
      esterilizado: ['', [Validators.required]],
      actividad: ['', [Validators.required]],
      vacunas: ['', [Validators.required]],
      sociable: [false, [Validators.required]],
      tratamiento: [false, [Validators.required]],
      detalleTratamiento: [''],
      description: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ,.\\n]+$'),
      Validators.maxLength(150)]],
      especie: ['', [Validators.required]],
      raza: ['', [Validators.required]]
    });

  }

  ngOnInit(): void {
    this.loadIdUser();
    this.loadEspecies();
    this.setTodayDate();


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
              this.sucursalDataId = data[0].id;
              console.log('Sucursal ID: ' + this.sucursalDataId)
              this.loadReports(this.sucursalDataId);
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


  navigateToURL(url: string): void {
    this.router.navigateByUrl(url);
  }

  loadIdUser(): void {
    this.apiService.getIdOrganizationUser().subscribe(
      (response) => {
        this.userId = response;
        this.organizationIdUser = response.sucursal;
        this.signupPet.patchValue({ sucursal: this.organizationIdUser });
        this.loadPets(this.organizationIdUser);
      },
      (error) => {
        console.error('Error al obtener el id :', error);
      }
    );
  }

  loadPets(sucursalIdUser: number): void {
    // Obtener mascotas de la sucursal
    this.apiService.getPetOrganization(sucursalIdUser).subscribe(
      (response) => {
        this.pets = response;
        this.filteredPets = response;
        this.petsSubject.next(response);

        // Inicializar los contadores
        this.petCount = this.pets.length;
        this.adoptedPetCount = this.pets.filter(pet => pet.estado === 'Adoptado').length;
        this.pendingApplicationCount = this.pets.filter(pet => pet.estado === 'Pendiente').length;


        // Obtener perfiles por coincidencia para cada mascota
        this.pets.forEach((pet) => {
          const mascotaId = pet.id;

          this.apiService.getCoincidenceByPet(mascotaId).subscribe(
            (data: any[]) => {
              if (data && data.length > 0) {
                // Asigna los perfiles coincidentes a cada mascota
                pet.coincidences = data;
              } else {
                pet.coincidences = []; // Manejar caso donde no hay coincidencias
              }
            },
            (error: any) => {
              console.error(`Error al cargar coincidencias para mascota ID ${mascotaId}:`, error);
            }
          );
        });

        // Contar la cantidad de mascotas
        this.petCount = this.pets.length;
      },
      (error) => {
        console.error('Error al obtener la lista de mascotas:', error);
      }
    );
  }

  loadEspecies(): void {
    this.apiService.getEspecies().subscribe(
      (data: any[]) => {
        this.especies = data;

        const savedEspecieId = this.modPetForm.get('especie')?.value;
        console.log(savedEspecieId)
        if (savedEspecieId) {
          this.loadRazasPorEspecie(savedEspecieId);
          console.log("holaa holaa olvidon")
        }
      },
      (error: any) => {
        console.error('Error al cargar especies:', error);
      }
    );
  }

  loadRazasPorEspecie(especieId: number): void {
    if (especieId) {
      this.apiService.getRazasPorEspecie(especieId).subscribe(
        (data: any[]) => {
          this.razas = data;

          // Obtener el valor de la raza guardada en el formulario y auto-seleccionarla
          const savedRazaId = this.modPetForm.get('raza')?.value;
          console.log('Raza guardada en el formulario:', savedRazaId);
          if (savedRazaId && this.razas.find(raza => raza.id === savedRazaId)) {
            this.modPetForm.patchValue({ raza: savedRazaId });
            console.log("holaa holaa olvidon")
          }

        },
        (error: any) => {
          console.error('Error al cargar razas por especie:', error);
        }
      );
    } else {
      this.razas = []; // Limpiar las razas si no se selecciona una especie
    }
  }

  onEspecieChange(event: any): void {

    // Verifica si 'modPetForm' se usa para el mismo formulario y si es así, obtén el ID de la especie seleccionada
    const modEspecieId = this.modPetForm.get('especie')?.value;
    if (modEspecieId) {
      this.loadRazasPorEspecie(modEspecieId);
    }

    // Verifica si 'signupPet' se usa para el mismo formulario y si es así, obtén el ID de la especie seleccionada
    const selectedEspecieId = this.signupPet.get('especie')?.value;
    if (selectedEspecieId) {
      this.loadRazasPorEspecie(selectedEspecieId);
    }

  }

  /* Obtener fecha actual */
  setTodayDate(): void {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    this.signupPet.patchValue({ fecha: formattedDate });
    this.modPetForm.patchValue({ fecha: formattedDate });
  }

  /* Modals */
  openPetModal() {
    this.isPetModalOpen = true;
  }
  closePetModal() {
    this.isPetModalOpen = false;
  }

  openModal() {
    this.isModalOpen = true;
  }
  closeModal() {
    this.isModalOpen = false;
  }

  /* Búsqueda mascota */
  search(): void {
    this.filteredPets = this.currentPets.filter(pet =>
      pet.nombre.toLowerCase().includes(this.searchPet.toLowerCase())
    );
  }


  clearSearch(): void {
    this.searchPet = '';
    this.filteredPets = this.currentPets;
  }


  /* Eliminar mascota */
  deletePet(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta mascota?')) {
      this.apiService.deletePet(id).subscribe(
        (response) => {
          console.log('Mascota eliminada: ', response);
          this.pets = this.pets.filter(pet => pet.id !== id);
          this.filteredPets = this.pets;
          this.loadPets(this.signupPet.value.organizacion);
          this.petsSubject.next(this.pets);
        },
        (error) => {
          console.error('Error al eliminar la mascota: ', error);
        }
      );
    }
  }

  /* Enviar formulario registro mascota */
  onSubmitNewPet(): void {
    if (this.signupPet.valid) {
      const formData = new FormData();

      const formMascota = {
        imagen: this.signupPet.value.photo,
        microchip: this.signupPet.value.microchip,
        nombre: this.signupPet.value.namePet,
        fecha_nacimiento: this.signupPet.value.dateNac,
        sexo: this.signupPet.value.gender,
        color: this.signupPet.value.color,
        patron: this.signupPet.value.patron,
        esterilizado: this.signupPet.value.esterilizado,
        sociable: this.signupPet.value.sociable,
        tratamiento: this.signupPet.value.tratamiento,
        tratamientoDescripcion: this.signupPet.value.tratamiento ? this.signupPet.value.detalleTratamiento : 'Necesita tratamiento específico',
        actividad: this.signupPet.value.actividad,
        vacunas: this.signupPet.value.vacunas,
        descripcion: this.signupPet.value.description,
        raza: this.signupPet.value.raza
      };
      console.log(formMascota)

      // Mostrar el valor de photo en consola
      const photo = this.signupPet.get('photo')?.value;

      // Agregar la imagen solo si es un archivo válido
      if (photo instanceof File) {
        formData.append('imagen', photo, photo.name);
      }

      // Añadir cada campo de formMascota a formData
      Object.entries(formMascota).forEach(([key, value]) => {
        formData.append(key, value as string);
      });

      // Registrar la mascota
      this.apiService.registerMascota(formData).subscribe(
        (responseMascota) => {
          console.log('Mascota registrada:', responseMascota);

          // Obtener el ID de la mascota registrada
          const mascotaId = responseMascota.id;

          // Preparar datos para el estado de la mascota
          const formEstado = {
            mascota: mascotaId, // Usar el ID de la mascota registrada
            sucursal: this.organizationIdUser,
            estado: this.signupPet.value.estado,
            fecha: this.signupPet.value.fecha ? new Date(this.signupPet.value.fecha).toISOString().split('T')[0] : null
          };

          // Registrar el estado de la mascota
          this.apiService.registerEstado(formEstado).subscribe(
            (responseEstado) => {
              console.log('Estado de mascota registrado:', responseEstado);
              alert('Mascota registrada correctamente.');
              this.isPetModalOpen = false;

              // Agregar la nueva mascota y su estado a la lista de mascotas
              const newPetWithState = { ...responseMascota, estado: responseEstado.estado };
              this.pets.push(newPetWithState);
              this.filteredPets = [...this.pets]; // Actualizar la lista filtrada
              this.petsSubject.next(this.pets); // Actualizar el BehaviorSubject
              this.refreshPage();
              this.signupPet.reset(); // Resetea el formulario después de registrar la mascota
              this.profileImageUrl = null;
            },
            (errorEstado) => {
              console.error('Error al registrar el estado de la mascota:', errorEstado);
              alert('Error al registrar el estado de la mascota.');
            }
          );
        },
        (errorMascota) => {
          console.error('Error al registrar la mascota:', errorMascota);
          alert('Error al registrar la mascota, microchip ya existente.');
        }
      );
    } else {
      console.log('Formulario de mascota no válido');
      alert('El formulario de mascota no es válido.');
    }
  }

  /* Abrir modal modificar mascota */
  openPetEditModal(id: number): void {
    this.apiService.getPet(id).subscribe(
      data => {
        console.log('Datos de la mascota obtenidos:', data);
        this.apiService.getPetEstado(data.id).subscribe(
          estadoArray => {
            const estadoData = estadoArray[0];

            this.idPet = data.id;

            // Construir la URL completa de la imagen si data.imagen es solo el nombre del archivo
            const imageUrl = data.imagen.startsWith('http') ? data.imagen : `ruta-base/${data.imagen}`;

            // Cargar las razas correspondientes a la especie de la mascota
            this.loadRazasPorEspecie(data.especie_id);

            const patchValues = {
              photo: imageUrl,
              microchip: data.microchip,
              namePet: data.nombre,
              dateNac: data.fecha_nacimiento,
              gender: data.sexo,
              color: data.color,
              patron: data.patron,
              esterilizado: data.esterilizado,
              actividad: data.actividad,
              vacunas: data.vacunas,
              sociable: data.sociable,
              tratamiento: data.tratamiento,
              detalleTratamiento: data.tratamientoDescripcion,
              description: data.descripcion,
              especie: data.especie_id,
              raza: data.raza,
              estado: estadoData?.estado,
              fecha: estadoData?.fecha
            };

            this.modPetForm.patchValue(patchValues);
            console.log('Valores a aplicar al formulario:', patchValues);
            this.profileImageUrl = imageUrl; // Asignar la URL de la imagen de la mascota

            this.isPetEditModalOpen = true;
          },
          error => console.error('Error al cargar el estado de la mascota:', error)
        );
      },
      error => console.error('Error al cargar detalles de la mascota:', error)
    );
  }

  /* Cerrar modal modificar mascota */
  closePetEditModal() {
    this.isPetEditModalOpen = false;
  }

  /* Enviar formulario modificar mascota */
  onSubmitEditPet(): void {
    if (this.modPetForm.valid) {
      // Mostrar alerta para confirmar la actualización
      if (confirm('¿Estás seguro de que deseas actualizar los datos de la mascota?')) {
        const petData = this.modPetForm.value;

        // Crear formData para enviar los datos
        const formData = new FormData();
        formData.append('microchip', petData.microchip);
        formData.append('nombre', petData.namePet);
        formData.append('dateNac', petData.dateNac);
        formData.append('gender', petData.gender);
        formData.append('color', petData.color);
        formData.append('patron', petData.patron);
        formData.append('esterilizado', petData.esterilizado.toString());
        formData.append('actividad', petData.actividad);
        formData.append('vacunas', petData.vacunas.toString());
        formData.append('sociable', petData.sociable.toString());
        formData.append('tratamiento', petData.tratamiento.toString());
        formData.append('tratamientoDescripcion', petData.detalleTratamiento);
        formData.append('descripcion', petData.description);
        formData.append('raza', petData.raza);

        // Agregar la imagen de la mascota si se ha seleccionado una nueva
        if (petData.photo instanceof File) {
          formData.append('imagen', petData.photo, petData.photo.name);
        }

        // Llamar al servicio para actualizar la mascota
        this.apiService.updatePet(this.idPet, formData).subscribe(
          (response: any) => {
            console.log('Mascota actualizada correctamente:', response);

            // Mostrar alerta de éxito
            alert('Los datos de la mascota se actualizaron correctamente.');
            this.isPetEditModalOpen = false; // Cerrar el modal después de la actualización exitosa

            // Actualizar la lista de mascotas después de actualizar la mascota
            this.loadPets(this.organizationIdUser);

          },
          error => {
            console.error('Error al actualizar la mascota:', error);
            alert('Error al actualizar la mascota. Por favor, intenta de nuevo.');
          }
        );

      } else {
        console.log('Actualización cancelada por el usuario.');
      }
    } else {
      console.log('Formulario no válido');
      this.modPetForm.markAllAsTouched();
    }
  }

  /* Detalles Mascota */
  openDetallesPetModal(id: number): void {
    this.apiService.getPet(id).subscribe(
      data => {
        this.petSelected = data;
        this.isPetDetallesModalOpen = true;
      },
      error => console.error('Error al cargar detalles de la mascota:', error)
    );
  }

  /* Cerrar modal detalles mascota */
  closeDetallesPetModal() {
    this.isPetDetallesModalOpen = false;
  }


  /* Mensajes validaciones mascota */

  //Validación foto de la mascota
  getPhotoMessage() {
    const photoControl = this.signupPet.get('photo');
    if (photoControl?.errors?.['required']) {
      return 'Este campo es requerido.';
    }
    return '';
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          this.profileImageUrl = e.target.result as string;
        }
      };
      reader.readAsDataURL(file);

      this.signupPet.patchValue({ photo: file });
      this.signupPet.get('photo')?.updateValueAndValidity();

      this.modPetForm.patchValue({ photo: file });
      this.modPetForm.get('photo')?.updateValueAndValidity();
    }
  }

  // Validación Microchip
  getMicrochipMessage() {
    const microchipControl = this.signupPet.get('microchip');

    if (microchipControl?.errors?.['required']) {
      return 'Este campo es requerido.';
    }
    if (microchipControl?.errors?.['pattern']) {
      return 'El código solo puede contener números.';
    }

    return '';
  }

  // Validación Nombre
  getNamePetMessage() {
    const namePetControl = this.signupPet.get('namePet');

    if (namePetControl?.errors?.['required']) {
      return 'Este campo es requerido.';
    }

    if (namePetControl?.errors?.['pattern']) {
      return 'Ingresa un nombre válido.';
    }

    return '';
  }

  // Validación Fecha de nacimiento

  // Validación para asegurar que la fecha no esté en el futuro
  dateNot(control: AbstractControl): ValidationErrors | null {
    const selectedDate = new Date(control.value);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Ajusta la hora para comparar solo la fecha

    // Validación para asegurar que la fecha no esté en el futuro
    if (selectedDate > currentDate) {
      return { date: true };
    }

    // Validación para que la fecha sea igual o menor a 20 años
    const twentyYearsAgo = new Date();
    twentyYearsAgo.setFullYear(currentDate.getFullYear() - 20);

    // Si la fecha seleccionada es mayor que hace 20 años, retorna un error
    if (selectedDate < twentyYearsAgo) {
      return { tooOld: true };
    }

    return null;
  }

  getDateNacMessage() {
    const dateNacControl = this.signupPet.get('dateNac');

    if (dateNacControl?.errors?.['required']) {
      return 'Este campo es requerido.';
    }
    if (dateNacControl?.errors?.['date']) {
      return 'Ingresa una fecha de nacimiento válida.';
    }
    if (dateNacControl?.errors?.['tooOld']) {
      return 'La fecha de nacimiento no puede ser mayor a 20 años. Si la mascota tiene más años de lo permitido, ingresa un aproximado.';
    }
    return '';
  }

  // Validación Género
  getGenderMessage() {
    const genderControl = this.signupPet.get('gender');

    if (genderControl?.errors?.['required']) {
      return 'Debes seleccionar una opción.';
    }

    return '';
  }

  // Validación Color 
  getColorMessage() {
    const colorControl = this.signupPet.get('color');

    if (colorControl?.errors?.['required']) {
      return 'Debes seleccionar una opción.';
    }

    return '';
  }

  // Validación Patrón 
  getPatronMessage() {
    const patronControl = this.signupPet.get('patron');

    if (patronControl?.errors?.['required']) {
      return 'Debes seleccionar una opción.';
    }

    return '';
  }

  // Validación Esterilizado 
  getEsterilizadoMessage() {
    const esterilizadoControl = this.signupPet.get('esterilizado');

    if (esterilizadoControl?.errors?.['required']) {
      return 'Debes seleccionar una opción.';
    }

    return '';
  }

  // Validación Actividad 
  getActividadMessage() {
    const actividadControl = this.signupPet.get('actividad');

    if (actividadControl?.errors?.['required']) {
      return 'Debes seleccionar una opción.';
    }

    return '';
  }

  // Validación Raza 
  getRazaMessage() {
    const razaControl = this.signupPet.get('raza');

    if (razaControl?.errors?.['required']) {
      return 'Debes seleccionar una opción.';
    }

    return '';
  }

  // Validación Especie 
  getEspecieMessage() {
    const especieControl = this.signupPet.get('especie');

    if (especieControl?.errors?.['required']) {
      return 'Debes seleccionar una opción.';
    }

    return '';
  }

  // Validación Descripción
  getVacunasMessage() {
    const vacunasControl = this.signupPet.get('vacunas');

    if (vacunasControl?.errors?.['required']) {
      return 'Este campo es requerido.';
    }

    return '';
  }

  onVacunasChange(event: any) {
    const isChecked = event.target.checked;
    if (isChecked) {

    }
  }

  // Validación Sociabilidad 
  getSociableMessage() {
    const sociableControl = this.signupPet.get('sociable');

    if (sociableControl?.errors?.['required']) {
      return 'Debes seleccionar una opción.';
    }

    return '';
  }

  onSociableChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.signupPet.patchValue({ sociable: checkbox.checked });
  }

  // Validación Tratamiento 
  getTratamientoMessage() {
    const tratamientoControl = this.signupPet.get('tratamiento');

    if (tratamientoControl?.errors?.['required']) {
      return 'Debes seleccionar una opción.';
    }

    return '';
  }

  onTratamientoChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.signupPet.patchValue({ tratamiento: checkbox.checked });
  }

  // Validación Detalles del Tratamiento
  getDetalleTratamientoMessage() {
    const detalleTratamientoControl = this.signupPet.get('detalleTratamiento');
    if (detalleTratamientoControl?.errors?.['required']) {
      return 'Este campo es requerido.';
    }
    return '';
  }

  // Validación Descripción
  getDescriptionMessage() {
    const descriptionControl = this.signupPet.get('description');

    if (descriptionControl?.errors?.['required']) {
      return 'Este campo es requerido.';
    }

    if (descriptionControl?.errors?.['pattern']) {
      return 'Ingresa una descripción válida.';
    }
    if (descriptionControl?.errors?.['maxLength']) {
      return 'La descripción puede tener como máximo 150 caracteres.';
    }
    return '';
  }

  // Validación Estado
  getEstadoMessage() {
    const descriptionControl = this.signupPet.get('estado');

    if (descriptionControl?.errors?.['required']) {
      return 'Este campo es requerido.';
    }

    return '';
  }

  /*---------- Reportes ----------*/
  showTable(table: string): void {
    this.currentTable = table;
    if (table === 'Pendiente') {
      this.currentPets = this.pets.filter(pet => pet.estado === 'Pendiente');
      this.pendingApplicationCount = this.currentPets.length;
    } else if (table === 'Adoptado') {
      this.currentPets = this.pets.filter(pet => pet.estado === 'Adoptado');
      this.adoptedPetCount = this.currentPets.length;
    } else if (table === 'reportes') {
      this.loadReports(this.sucursalDataId);
    } else {
      this.currentPets = this.pets;
      this.petCount = this.currentPets.length;
    }
    this.filteredPets = this.currentPets;
  }



  filterByEstado(estado: string): void {
    this.filteredPets = this.pets.filter(pet => pet.estado === estado);
  }

  selectTable(tableName: string) {
    if (this.selectedTable === tableName) {
      this.selectedTable = '';
    } else {
      this.selectedTable = tableName;
    }
  }

  openDetallesProfileModal(mascotaId: number): void {
    this.apiService.getCoincidenceByPet(mascotaId).subscribe(
      (data: any[]) => {
        if (data && data.length > 0) {
          this.coincidence = data[0]; // Asigna el primer elemento del array a coincidence
          this.isProfileDetallesModalOpen = true;
        } else {
          this.coincidence = null; // Maneja el caso donde no hay coincidencias
        }
      },
      (error: any) => {
        console.error('Error al cargar coincidencias por mascota:', error);
      }
    );
  }

  closeDetallesProfileModal(): void {
    this.isProfileDetallesModalOpen = false;
  }

  /*---------- Adopciones ----------*/
  Adoption(mascotaId: number) {
    this.apiService.getCoincidenceByPet(mascotaId).subscribe(
      (data: any[]) => {
        if (data && data.length > 0) {
          this.coincidence = data[0]; // Asigna el primer elemento del array a coincidence

          const adoption = {
            fecha: new Date().toISOString().split('T')[0], // Obtiene la fecha actual en formato ISO (YYYY-MM-DD)
            coincidencia: this.coincidence.id // Asegúrate de usar el ID de la coincidencia
          };

          if (confirm(`¿Estás seguro de dar en adopción a la mascota al postulante ${this.coincidence.profile.nombre_apellido} ?`)) {
            this.apiService.setAdoption(adoption).subscribe(
              (data: any) => {

                this.adoption = data;

                const estado = {
                  estado: 'Adoptado'
                };

                this.apiService.updateEstado(mascotaId, estado).subscribe(
                  response => {
                    alert(`Mascota adoptada por: ${this.coincidence.profile.nombre_apellido}`);
                    this.sendEmail(mascotaId);
                  }
                );
              },
              (error: any) => {
                console.error('Error al crear la adopción:', error);
              }
            );
          } else {
            console.log('Adopción cancelada por el usuario.');
          }
        } else {
          this.coincidence = null;
          console.warn('No se encontraron coincidencias para la mascota especificada.');
        }
      },
      (error: any) => {
        console.error('Error al cargar coincidencias por mascota:', error);
      }
    );
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
                    <p style="font-size: 2rem; font-weight: 600;">En tu sucursal han dado en adopcion una mascota, puedes verificarlo en tu gestor de mascotas. Ya tienes acceso al correo de la persona en tu gestor de mascotas. </p>
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
    const emailUser = this.coincidence.profile.email
    console.log('Datos del usuario:', emailUser);

    const emails = [emailUser];
    const htmlTemplate = `
            <header style="background-image: url('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDA ... '); background-position: center center; background-size: cover; height: 100vh; width: 100vw; display: flex; justify-content: center; align-items: center; text-align: center;">
              <div class="container">
                <div class="row align-items-center">
                  <div class="col-md-5 p-5 mb-5 mt-5">
                    <h1 style="font-size: 4rem; padding: 15px; font-weight: 700;">¡Adopta.Me!</h1>
                    <p style="font-size: 2rem; font-weight: 600;">Felicidades, fuiste seleccionado para adoptar a una mascota :D!! <br> Ya puedes revisar tu apartado de coincidencias para verificar el estado de tu mascota!!</p>
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
  }

  refreshPage(): void {
    window.location.reload();
  }

  updatePetCounts(): void {
    this.petCount = this.pets.length;
    this.adoptedPetCount = this.pets.filter(pet => pet.estado === 'Adoptado').length;
    this.pendingApplicationCount = this.pets.filter(pet => pet.estado === 'Pendiente').length;
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
            },

            (error: any) => {
              console.error('Error al eliminar la coincidencia: ', error);
            }
          );
          this.refreshPage();
        },
        (error: any) => {
          console.error('Error al actualizar el estado de la mascota: ', error);
        }
      );
    }
  }

  /* Whatsapp */
  getWhatsappLink(phoneNumber: string): string {
    return `https://wa.me/${phoneNumber}`;
  }

  loadReports(sucursalIdUser: number): void {
    this.apiService.getEventosAlternative(sucursalIdUser).subscribe(
      (response) => {
        console.log('Eventos cargados:', response);
        this.reports = response;
      },
      (error) => {
        console.error('Error al obtener la lista de reportes:', error);
      }
    );

  }

}

