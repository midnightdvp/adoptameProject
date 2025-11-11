import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavstyComponent } from '../navsty/navsty.component';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { FormGroup, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { response } from 'express';
import { EmailService } from '../services/email.service';

@Component({
  selector: 'app-administration',
  standalone: true,
  imports: [CommonModule, NavstyComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './administration.component.html',
  styleUrls: ['./administration.component.css']
})

export class AdministrationComponent {
  /* Usuario */
  userOrg: FormGroup;
  users: any[] = [];

  /* Organizacion y sucursal */
  organizations: any[] = [];
  filteredOrganizations: any[] = [];
  sucursales: any[] = [];
  currentOrganizationId: number | null = null;
  currentSucursalId: number | null = null;
  searchOrganization = '';
  organizationId: any;
  sucursalDetails: any;

  /* Modals */
  isModalOpen = false;
  isOrgModalOpen = false;
  isOrgEditModalOpen = false;
  isSucursalModalOpen = false;
  isSucursalesModalOpen = false;
  isSucursalEditModalOpen = false;
  isSucursalDetailModalOpen = false;

  /* Form de Organización y sucursal */
  signupOrgForm: FormGroup;
  signupSucursalForm: FormGroup;
  modOrgForm: FormGroup;
  modSucursalForm: FormGroup;
  organization: any;
  idOrg: any;
  sucursalId: any;

  /* Region y Comuna */
  communes: any[] = [];
  regions: any[] = [];

  /* URL para enviar correo */
  url: string = '';

  /* Observable */
  orgsSubject = new BehaviorSubject<any[]>([]);
  sucursalesSubject = new BehaviorSubject<any[]>([]);

  constructor(private router: Router, private apiService: ApiService, private formBuilder: FormBuilder, private emailService: EmailService) {
    this.userOrg = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email, Validators.pattern('^[a-z0-9_.-]+@[a-z.-]+\\.[a-z]{2,}$')]],
    });

    this.signupOrgForm = this.formBuilder.group({
      nombre_organizacion: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+(?:\\s[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+)*$')]],
      rut_empresa: ['', [Validators.required, Validators.pattern(/^\d{1,2}\.\d{3}\.\d{3}-[\dKk]$/), this.validateRutOrg]],

    });

    this.signupSucursalForm = this.formBuilder.group({
      organizacion: [''],
      nombre_sucursal: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+(?:\\s[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+)*$')]],
      region: ['', [Validators.required]],
      comuna: ['', [Validators.required]],
      direccion: ['', [Validators.required, Validators.pattern('^(?=.*\\d{3,4})([a-zA-ZñÑáéíóúÁÉÍÓÚ ]+\\d*)+$')]]

    });

    this.modOrgForm = this.formBuilder.group({
      nombre_organizacion: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+(?:\\s[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+)*$')]]
    });

    this.modSucursalForm = this.formBuilder.group({
      nombre_sucursal: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+(?:\\s[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+)*$')]],
      region: ['', [Validators.required]],
      comuna: ['', [Validators.required]],
      direccion: ['', [Validators.required, Validators.pattern('^(?=.*\\d{3,4})([a-zA-ZñÑáéíóúÁÉÍÓÚ ]+\\d*)+$')]]

    });
  }


  /*----------Cargar elementos al iniciar la pagina----------*/
  ngOnInit(): void {
    this.loadOrganizations();
    this.loadRegions();

    this.sucursalesSubject.subscribe(sucursales => {
      this.sucursales = sucursales;
    });
  }

  /*----------Métodos para organizacion----------*/
  /* Registrar organización */
  onSubmitNewOrg(): void {
    if (this.signupOrgForm.valid) {
      const formData = this.signupOrgForm.value;

      const mappedFormData = {
        nombre_organizacion: formData.nombre_organizacion,
        rut_empresa: formData.rut_empresa,
      };

      this.apiService.registerOrganization(mappedFormData).subscribe(
        response => {
          console.log('Organización registrada:', response);
          alert('Organización registrada con éxito.');
          this.orgsSubject.next(this.organizations); // Actualizar el BehaviorSubject
          this.closeOrgModal();
          // Agregar la nueva organización a la lista de organizaciones
          this.organizations.push(response);
          this.filteredOrganizations = [...this.organizations];
          this.orgsSubject.next(this.organizations); // Actualizar el BehaviorSubject
        },
        error => {
          console.error('Error al registrar la organización:', error);
        }
      );
    } else {
      console.log('Formulario no válido');
      console.log(this.signupOrgForm.errors);
      this.logValidationErrors(this.signupOrgForm);
    }
  }

  /* Cargar datos */
  loadOrganizations(): void {
    this.apiService.getOrganizations().subscribe(
      data => {
        this.organizations = data;
        this.filteredOrganizations = data;
        this.orgsSubject.next(data);
      },
      error => {
        console.error('Error al cargar organizaciones:', error);
      }
    );
  }

  loadOrganizationDetails(id: number): void {
    this.apiService.getOrganizationById(id).subscribe(
      data => {
        this.modOrgForm.patchValue({
          nombre_organizacion: data.nombre_organizacion,
          comuna: data.comuna,
          direccion: data.direccion,
          region_id: data.region_id
        });
        // Si hay un region_id en los detalles de la organización, cargar las comunas correspondientes
        if (data.region_id) {
          this.loadCommunes(Number(data.region_id));
        }
      },
      error => {
        console.error('Error al cargar detalles de la organización:', error);
      }
    );
  }

  /* Actualizar organización */
  openOrgEditModal(id: number): void {
    this.apiService.getOrganizationById(id).subscribe(
      data => {
        console.log(this.organizations)
        this.organizations = data;
        this.loadOrganizationDetails(id);
        this.idOrg = data.id;
        this.isOrgEditModalOpen = true;
      },
      error => {
        console.error('Error al obtener detalles de la organización:', error);
      }
    );
  }

  onSubmitModOrg(): void {
    if (this.modOrgForm.valid) {
      const formData = this.modOrgForm.value; // Obtener los datos del formulario
      // Llamar al servicio para actualizar la organización
      this.apiService.updateOrganization(this.idOrg, formData).subscribe(
        (response: any) => {
          alert('Organización actualizada correctamente.');
          console.log('Organización actualizada correctamente:', response);
          this.isOrgEditModalOpen = false;
          this.loadOrganizations();
          this.filteredOrganizations = this.organizations;
          this.orgsSubject.next(response);
          // Cerrar el modal después de la actualización exitosa
          this.refreshPage();
        },
        error => {
          console.error('Error al actualizar organización:', error);
        }
      );
    } else {
      console.log('Formulario no válido');
      // Marcar todos los campos del formulario como tocados para mostrar mensajes de error
      this.modOrgForm.markAllAsTouched();
    }
  }

  refreshPage(): void {
    window.location.reload();
  }
  /* Eliminar organización */
  deleteOrganization(id: number) {
    if (confirm('¿Estás seguro de que deseas eliminar esta organización?')) {
      this.apiService.deleteOrganization(id).subscribe(
        response => {
          console.log('Organización eliminada:', response);
          alert('Organización eliminada con éxito.');
          this.organizations = this.organizations.filter(org => org.id !== id);
          this.filteredOrganizations = this.organizations;
          this.orgsSubject.next(this.organizations);
        },
        error => {
          console.error('Error al eliminar la organización:', error);
        }
      );
    }
  }

  /* Otros metodos */
  search() {
    if (this.searchOrganization.trim() !== '') {
      this.filteredOrganizations = this.organizations.filter(org =>
        org.nombre_organizacion.toLowerCase().includes(this.searchOrganization.toLowerCase())
      );
    } else {
      this.filteredOrganizations = this.organizations;
    }
  }

  clearSearch() {
    this.searchOrganization = '';
    this.filteredOrganizations = this.organizations;
  }

  /*----------Metodos para Sucursal----------*/

  /* Mostar usuario en la tabla de registro en el modal segun organizacion */
  prepareAddSucursal(id: number) {
    this.currentOrganizationId = id;
    this.openSucursalModal();
    this.sucursalList(id);
  }

  /* Mostrar sucursales */
  viewSucursales(id: number) {
    this.currentOrganizationId = id;
    this.sucursalList(id);
    this.isSucursalesModalOpen = true;
  }

  /* Registrar sucursal */
  onSubmitNewSucursal(): void {
    if (this.signupSucursalForm.valid) {
      const sucursalForm = {
        organizacion: this.currentOrganizationId,
        nombre_sucursal: this.signupSucursalForm.value.nombre_sucursal,
        comuna: this.signupSucursalForm.value.comuna,
        direccion: this.signupSucursalForm.value.direccion,
        region: this.signupSucursalForm.value.region
      };
  
      this.apiService.sucursalOrganization(sucursalForm).subscribe(
        (response: any) => {
          console.log('Sucursal registrada:', response);
          alert('Sucursal registrada con éxito.');
          this.addSucursalToSubject(response);
          this.closeSucursalModal();
  
          // Resetea el formulario de manera que los placeholders se mantengan
          this.signupSucursalForm.reset({
            organizacion: '',
            nombre_sucursal: '',
            comuna: '',
            direccion: '',
            region: ''
          });
  
          // Marca los selects como "untouched" para que los placeholders se muestren correctamente
          this.signupSucursalForm.get('comuna')?.markAsUntouched();
          this.signupSucursalForm.get('region')?.markAsUntouched();
        },
        error => {
          console.error('Error al registrar sucursal:', error);
        }
      );
    } else {
      console.log('Formulario no válido');
    }
  }
  

  /* Editar sucursal */
  openSucursalEditModal(sucursal_id: number): void {
    this.apiService.getSucursalById(sucursal_id).subscribe(
      data => {
        this.modSucursalForm.patchValue({
          nombre_sucursal: data.nombre_sucursal,
          region: data.region_id,
          comuna: data.comuna,
          direccion: data.direccion
        });
        this.sucursalId = data.id;
        this.isSucursalEditModalOpen = true;

        if (data.region_id) {
          this.loadCommunes(data.region_id);
        }
      },
      error => {
        console.error('Error al obtener detalles de la sucursal:', error);
      }
    );
  }

  onSubmitModSucursal(): void {
    if (this.modSucursalForm.valid) {
      const formData = this.modSucursalForm.value;
      this.apiService.updateSucursal(this.sucursalId, formData).subscribe(
        response => {
          alert('Sucursal actualizada correctamente.');
          console.log('Sucursal actualizada correctamente:', response);
          this.isSucursalEditModalOpen = false;
          this.sucursalList(this.currentOrganizationId!);
        },
        error => {
          console.error('Error al actualizar sucursal:', error);
        }
      );
    } else {
      this.modSucursalForm.markAllAsTouched();
    }
  }

  /* Eliminar sucursal */
  deleteSucursal(id: number) {
    if (confirm('¿Estás seguro de que deseas eliminar esta sucursal?')) {
      this.apiService.deleteSucursal(id).subscribe(
        response => {
          alert('Sucursal eliminada con éxito.');
          this.sucursales = this.sucursales.filter(suc => suc.id !== id);
          this.sucursalesSubject.next(this.sucursales);
        },
        error => {
          console.error('Error al eliminar la sucursal:', error);
        }
      );
    }
  }

  /* Ver detalles de la sucursal */
  viewSucursalDetails(id: number): void {
    this.apiService.getSucursalById(id).subscribe(
      data => {
        this.sucursalDetails = data;
        console.log('Datos de la sucursal:', data);

        // Obtener las comunas para la región de la sucursal
        this.apiService.getCommunes(data.region_id).subscribe(
          (communes: any[]) => {
            this.communes = communes;
            console.log('Comunas cargadas:', this.communes);

            const comuna = this.communes.find(comuna => comuna.id === data.comuna);
            if (comuna) {
              console.log('Comuna encontrada:', comuna);
              this.sucursalDetails.comunaNombre = comuna.nombre;

              const region = this.regions.find(region => region.id === comuna.region);
              if (region) {
                console.log('Región encontrada:', region);
                this.sucursalDetails.regionNombre = region.nombre;
              } else {
                console.error('No se encontró la región para la comuna proporcionada');
              }
            } else {
              console.error('No se encontró la comuna para la sucursal proporcionada');
            }
            this.isSucursalDetailModalOpen = true;
          },
          error => {
            console.error('Error al cargar comunas:', error);
          }
        );
      },
      error => {
        console.error('Error al obtener detalles de la sucursal:', error);
      }
    );
  }

  /* Cargar lista de suscursales */
  sucursalList(organizacion_id: number) {
    this.apiService.getSucursalOrganization(organizacion_id).subscribe(
      response => {
        this.sucursalesSubject.next(response);
      },
      error => {
        console.error('Error al obtener sucursales:', error);
      }
    );
  }

  addSucursalToSubject(sucursal: any) {
    const currentSucursales = this.sucursalesSubject.value;
    this.sucursalesSubject.next([...currentSucursales, sucursal]);
  }

  /* Métodos modals */
  openSucursalModal() {
    this.isSucursalModalOpen = true;
  }
  closeSucursalModal() {
    this.isSucursalModalOpen = false;
  }
  openModal() {
    this.isModalOpen = true;
  }
  closeModal() {
    this.isModalOpen = false;
  }
  openOrgModal() {
    this.isOrgModalOpen = true;
  }
  closeOrgModal() {
    this.isOrgModalOpen = false;
  }
  closeOrgEditModal() {
    this.isOrgEditModalOpen = false;
  }

  closeSucModal() {
    this.isSucursalModalOpen = false;
  }
  closeSucursalEditModal() {
    this.isSucursalEditModalOpen = false;
  }
  closeSucursalesModal() {
    this.isSucursalesModalOpen = false;
  }

  closeSucursalDetailModal() {
    this.isSucursalDetailModalOpen = false;
  }
  /*----------Metodos para usuario organizacion----------*/
  /* Mostar usuario en la tabla de registro en el modal segun sucursal */
  prepareAddUser(id: number) {
    this.currentSucursalId = id;
    this.openModal();
    this.closeSucursalModal();
    this.userList(id);
  }

  // Define la función de cifrado dentro de tu clase
  encrypt(id: number): string {
    // Ejemplo básico de cifrado (solo para demostración)
    const key = 123; // Clave de cifrado/descifrado (debería ser más segura en un entorno real)
    return (id ^ key).toString(); // XOR simple con una clave
  }

  /* Enviar invitacion a usuario organizacion */
  addUserToOrganization(): void {

    // Verificar si currentSucursalId no es nulo
    if (this.currentSucursalId !== null) {
      // Cifrar la ID antes de construir la URL
      const encryptedId = this.encrypt(this.currentSucursalId);

      // Construir la URL con la ID cifrada
      this.url = `http://localhost:4200/register-user-organization/${encryptedId}`;

      // Lógica adicional con la URL cifrada
    } else {
      console.error('currentSucursalId es null, no se puede usar en la URL');
    }

    const emails = [this.userOrg.value.email];
    const subject = 'Te invitamos a unirte en Adopta.Me';
    const htmlTemplate = `
      <div>
        <p>Haz clic en el siguiente enlace para registrarte:</p>
        <a href="${this.url}" target="_blank">${this.url}</a>
      </div>
    `;
    const plainMessage = 'Mensaje si HTML no es compatible'; // Mensaje si el HTML no es soportado

    this.emailService.sendEmail(emails, subject, htmlTemplate, plainMessage).subscribe(
      response => {
        console.log('Correo enviado exitosamente', response);
        alert('Correo enviado exitosamente.');
        this.userOrg.get('email')?.reset();
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

  /* Cargar lista de usuario */
  userList(sucursal_id: number) {
    this.apiService.getUsersOrganization(sucursal_id).subscribe(
      (response) => {
        this.users = response.map((user: any) => ({
          name: user.nombre_apellido,
          rut: user.rut,
          userOrganizacionId: user.id,
        }));
      },
      (error) => {
        console.error('Error al obtener los usuarios de la organización:', error);
      }
    );
  }

  /* Eliminar usuario */
  deleteUser(userOrganizacionId: number) {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      this.apiService.deleteUser(userOrganizacionId).subscribe(
        (response) => {
          console.log('Usuario eliminado exitosamente');
        },
        (error) => {
          console.error('Error al eliminar el usuario:', error);
        }
      );
    }
  }

  /*----------Métodos para cargar region y comuna----------*/
  loadRegionsAndCommunes(): void {
    this.apiService.getRegions().subscribe(
      (regions: any[]) => {
        this.regions = regions;
        console.log('Regiones cargadas:', this.regions);
      },
      error => {
        console.error('Error al cargar regiones:', error);
      }
    );
  }
  
  loadCommunes(regionId: number): void {
    this.apiService.getCommunes(regionId).subscribe(
      (data: any[]) => {
        this.communes = data;
      },
      error => {
        console.error('Error al cargar comunas:', error);
      }
    );
  }

  loadRegions(): void {
    this.apiService.getRegions().subscribe(
      (data: any[]) => {
        this.regions = data;
        // Si tienes un ID de región guardado previamente, puedes cargar las comunas automáticamente
        const savedRegionId = this.modSucursalForm.get('region_id')?.value;
        if (savedRegionId) {
          this.loadCommunes(savedRegionId);
        }
      },
      error => {
        console.error('Error al cargar regiones:', error);
      }
    );
  }

  onRegionChange(event: any): void {
    const regionId = Number(event.target.value);
    this.loadCommunes(regionId);
    this.modSucursalForm.patchValue({ comuna: '' });
  }

  logValidationErrors(group: FormGroup): void {
    Object.keys(group.controls).forEach(key => {
      const control = group.get(key);
      if (control instanceof FormGroup) {
        this.logValidationErrors(control);
      } else {
        if (control && control.invalid) {
          console.log(`Key: ${key}, Errors: `, control.errors);
        }
      }
    });
  }

  /*---------- Validaciones registro usuario ----------*/

  // Validación Email
  getEmailMessage() {
    const emailControl = this.userOrg.get('email');

    if (emailControl?.errors?.['required']) {
      return 'Este campo es requerido.';
    }
    if (emailControl?.errors?.['email']) {
      return 'Formato de email inválido.';
    }
    if (emailControl?.errors?.['pattern']) {
      return 'Formato de email inválido.';
    }
    return '';
  }

  /*---------- Validaciones registro organización ----------*/

  //Validaciones registro organización
  getRutOrgMessage() {
    const rutControl = this.signupOrgForm.get('rut_empresa');

    if (rutControl?.errors?.['required']) {
      return 'Este campo es requerido.';
    }
    if (rutControl?.errors?.['pattern']) {
      return 'Ingrese un RUT válido.';
    }
    if (rutControl?.errors?.['rutInvalido']) {
      return 'RUT inválido.';
    }
    return '';
  }

  formatRutOrg(event: any) {
    let value = event.target.value.replace(/[^\dKk]/g, '');

    value = value.slice(0, -1).replace(/k/gi, '') + value.slice(-1);

    let formattedRut = '';

    if (value.length > 9) {
      value = value.slice(0, 9);
    }

    if (value.length > 0) {
      formattedRut = value.slice(0, -1).replace(/^(\d{1,2})(\d{3})(\d{3})/, '$1.$2.$3') + '-' + value.slice(-1);
      if (value.slice(-1).toLowerCase() === 'k') {
        formattedRut = formattedRut.slice(0, -1) + 'K';
      }
    }
    this.signupOrgForm.get('rut_empresa')?.setValue(formattedRut, { emitEvent: false });
  }

  validateRutOrg(control: any) {
    const rut = control.value.replace(/\./g, '').replace('-', '');
    const rutBody = rut.slice(0, -1);
    const dv = rut.slice(-1).toUpperCase();

    let sum = 0;
    let multiplier = 2;

    for (let i = rutBody.length - 1; i >= 0; i--) {
      sum += parseInt(rutBody[i], 10) * multiplier;
      multiplier = multiplier < 7 ? multiplier + 1 : 2;
    }
    const mod11 = 11 - (sum % 11);
    const calculatedDV = mod11 === 11 ? '0' : mod11 === 10 ? 'K' : mod11.toString();

    if (calculatedDV !== dv) {
      return { rutInvalido: true };
    }
    return null;
  }

  getNameOrgMessage() {
    const nameControl = this.signupOrgForm.get('nombre_organizacion');

    if (nameControl?.errors?.['required']) {
      return 'Este campo es requerido.';
    }

    if (nameControl?.errors?.['pattern']) {
      return 'Ingrese un nombre válido.';
    }

    return '';
  }

  /*---------- Validaciones registro sucursal ----------*/
  getNameSucursalMessage() {
    const nameControl = this.signupSucursalForm.get('nombre_sucursal');

    if (nameControl?.errors?.['required']) {
      return 'Este campo es requerido.';
    }

    if (nameControl?.errors?.['pattern']) {
      return 'Ingrese un nombre válido.';
    }

    return '';
  }

  getCommuneOrgMessage() {
    const communeControl = this.signupSucursalForm.get('comuna');
    if (communeControl?.errors?.['required']) return 'Debes seleccionar una opción.';
    return '';
  }

  getRegionOrgMessage() {
    const regionControl = this.signupSucursalForm.get('region');
    if (regionControl?.errors?.['required']) return 'Debes seleccionar una opción.';
    return '';
  }

  getAddressOrgMessage() {
    const addressControl = this.signupSucursalForm.get('direccion');

    if (addressControl?.errors?.['required']) {
      return 'Este campo es requerido.';
    }

    if (addressControl?.errors?.['pattern']) {
      return 'Ingrese una dirección válida.';
    }

    return '';
  }

  /*---------- NavigateToURL kbrom ----------*/
  navigateToURL(url: string): void {
    this.router.navigateByUrl(url);
  }

}