import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { Router } from '@angular/router';
import { StorageService } from '../services/storage.service';
import { HttpClient } from '@angular/common/http';
import { NavstyComponent } from '../navsty/navsty.component';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavstyComponent],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent {
  baseUrl: string = 'http://localhost:8000';
  profileImageUrl: string | ArrayBuffer | null = null;
  regions: any[] = [];
  communes: any[] = [];

  profileForm: FormGroup;
  emailForm: FormGroup;
  phoneForm: FormGroup;
  passwordForm: FormGroup;

  isEmail: boolean = false;
  isPhone: boolean = false;
  isPassword: boolean = false;

  constructor(private apiService: ApiService, private router: Router, private storageService: StorageService, private http: HttpClient, private fb: FormBuilder) {
    this.profileForm = this.fb.group({
      profileImage: [null],
      nombreApellido: ['', [Validators.required, Validators.pattern('^(?:[a-zA-ZáéíóúÁÉÍÓÚñÑ]+\\s)+[a-zA-ZáéíóúÁÉÍÓÚñÑ]+$')]],
      telefono: ['9', [Validators.required, Validators.pattern(/^9\d{8}$/)]],
      region_id: ['', [Validators.required]],
      commune: ['', [Validators.required]],
      direccion: ['', [Validators.required, Validators.pattern('^(?=.*\\d{3,4})([a-zA-ZñÑ .]+\\d*)+$')]]
    });
    this.emailForm = this.fb.group({
      email: ['', Validators.required],
      password1: ['']
    });

    this.phoneForm = this.fb.group({
      phone_number: ['', Validators.required],
      password1: ['']
    });

    this.passwordForm = this.fb.group({
      password1: ['', Validators.required],
      password2: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadRegion();
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.apiService.accountUser().subscribe(
      (data: any) => {
        console.log('Datos del usuario:', data);
        this.profileForm.patchValue({
          profileImage: data.profile.foto_perfil,
          nombreApellido: data.profile.nombre_apellido,
          telefono: data.profile.telefono,
          region_id: data.profile.region_id,
          commune: data.profile.comuna,
          direccion: data.profile.domicilio
        });
        this.emailForm.patchValue({
          email: data.user.email
        });
        this.phoneForm.patchValue({
          phone_number: data.user.phone_number
        });
        this.profileImageUrl = this.baseUrl + data.profile.foto_perfil;

        if (data.profile.region_id) {
          this.loadComuna(Number(data.profile.region_id));
        }
      },
      (error: any) => {
        console.error('Error al cargar el perfil del usuario:', error);
      }
    );
  }

  saveUserProfile(): void {
    if (this.profileForm.valid) {
      const userConfirmed = confirm('¿Estás seguro de que deseas guardar los cambios?');

      if (userConfirmed) {
        const formData = new FormData();
        const profileValues = this.profileForm.value;
        formData.append('nombre_apellido', profileValues.nombreApellido);
        formData.append('telefono', profileValues.telefono);
        formData.append('comuna', profileValues.commune);
        formData.append('domicilio', profileValues.direccion);

        if (profileValues.profileImage instanceof File) {
          formData.append('foto_perfil', profileValues.profileImage, profileValues.profileImage.name);
        }

        const idUser = localStorage.getItem('user');
        const profileId = idUser ? Number(idUser) : null;
        if (profileId !== null) {
          this.apiService.updateProfile(profileId, formData).subscribe(
            response => {
              console.log('User Profile updated:', response);
              // Mostrar alerta de éxito
              alert('Perfil actualizado exitosamente');
            },
            error => {
              console.error('Error updating profile:', error);
              // Mostrar alerta de error
              alert('Error al actualizar el perfil');
            }
          );
        }
      } else {
        // El usuario canceló la acción
        console.log('El usuario canceló la actualización del perfil');
      }
    } else {
      alert('Por favor, completa todos los campos requeridos antes de guardar.');
    }
  }

  saveEmail() {
    if (this.emailForm.get('password1')?.value) {
      if (this.emailForm.valid) {
        this.apiService.updateUser(this.emailForm.value).subscribe(
          response => {
            console.log('User Email updated:', response);
            alert('Correo electrónico actualizado con éxito');
            this.emailEdit(); // Opcional: Cambiar estado de edición de email
          },
          error => {
            console.error('Error updating email:', error);
            alert('Error al actualizar el correo electrónico');
          }
        );
      } else {
        console.error('Email form is invalid:', this.emailForm);
        alert('El formulario de correo electrónico no es válido. Revise los campos marcados.');
      }
    } else {
      console.error('Password required to change email.');
      alert('Se requiere la contraseña para cambiar el correo electrónico.');
    }
  }
  emailEdit() {
    this.isEmail = !this.isEmail;
  }

  savePhone() {
    if (this.phoneForm.get('password1')?.value) {
      if (this.phoneForm.valid) {
        this.apiService.updateUser(this.phoneForm.value).subscribe(
          response => {
            console.log('User Phone updated:', response);
            alert('Teléfono actualizado con éxito');
            this.phoneEdit(); // Opcional: Cambiar estado de edición de teléfono
          },
          error => {
            console.error('Error updating phone:', error);
            alert('Error al actualizar el teléfono');
          }
        );
      } else {
        console.error('Phone form is invalid:', this.phoneForm);
        alert('El formulario de teléfono no es válido. Revise los campos marcados.');
      }
    } else {
      console.error('Password required to change phone.');
      alert('Se requiere la contraseña para cambiar el teléfono.');
    }
  }
  phoneEdit() {
    this.isPhone = !this.isPhone;
  }

  savePassword() {
    const password1 = this.passwordForm.get('password1')?.value;
    const password2 = this.passwordForm.get('password2')?.value;

    if (password1 && password2) {
      if (password1 !== password2) {
        if (this.passwordForm.valid) {
          this.apiService.updateUser(this.passwordForm.value).subscribe(
            response => {
              console.log('User Password updated:', response);
              alert('Contraseña actualizada con éxito');
              this.passwordEdit(); // Opcional: Cambiar estado de edición de contraseña
            },
            error => {
              console.error('Error updating password:', error);
              alert('Error al actualizar la contraseña');
            }
          );
        } else {
          console.error('Password form is invalid:', this.passwordForm);
          alert('El formulario de contraseña no es válido. Revise los campos marcados.');
        }
      } else {
        console.error('Current and new passwords cannot be the same.');
        alert('La contraseña actual y la nueva no pueden ser iguales.');
      }
    } else {
      console.error('Both passwords are required.');
      alert('Se requieren ambas contraseñas.');
    }
  }
  passwordEdit() {
    this.isPassword = !this.isPassword;
  }



  loadRegion(): void {
    this.apiService.getRegions().subscribe(
      (data: any[]) => {
        this.regions = data;
        this.loadUserProfile();
      },
      (error: any) => {
        console.error('Error al cargar regiones:', error);
      }
    );
  }

  loadComuna(regionId: number): void {
    this.apiService.getCommunes(regionId).subscribe(
      (data: any[]) => {
        this.communes = data;
      },
      (error: any) => {
        console.error('Error al cargar comunas:', error);
      }
    );
  }

  onRegionChange(event: any): void {
    const regionId = Number(event.target.value);
    this.loadComuna(regionId);
    this.profileForm.patchValue({ commune: '' });
  }

  logout(): void {
    const userConfirmed = confirm('¿Estás seguro de que deseas cerrar sesión?');

    if (userConfirmed) {
      // Limpiar localStorage y redirigir
      this.storageService.clearLocalStorage(); // Suponiendo que esta función existe y borra datos relevantes
      this.router.navigateByUrl(''); // Redirigir a la página de inicio o a donde sea apropiado

    } else {
      console.log('El usuario canceló el cierre de sesión');
    }
  }

  navigateToURL(url: string): void {
    this.router.navigateByUrl(url);
  }

  //Validación foto de perfil
  getPhotoMessage() {
    const photoControl = this.profileForm.get('profileImage');
    if (photoControl?.errors?.['required']) {
      return 'Este campo es requerido.';
    }
    return '';
  }
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.profileForm.patchValue({ profileImage: file });
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          this.profileImageUrl = e.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  // Validación Nombre completo
  getNombreApellidoMessage() {
    const nombreApellidoControl = this.profileForm.get('nombreApellido');

    if (nombreApellidoControl?.errors?.['required']) {
      return 'Este campo es requerido.';
    }

    if (nombreApellidoControl?.errors?.['pattern']) {
      return 'Ingresa al menos un nombre y un apellido.';
    }

    return '';
  }
  // Validación Teléfono
  formatPhone(event: any): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Si el valor no empieza con +56 9, lo ajustamos
    if (!value.startsWith('9')) {
      value = '9' + value.replace(/^\s9?/, '');
    }

    // Limitar la entrada a 9 dígitos después de +56 9
    value = value.slice(0, 9);

    this.profileForm.get('telefono')?.setValue(value, { emitEvent: false });
  }

  getTelefonoMessage() {
    const telefonoControl = this.profileForm.get('telefono');

    if (telefonoControl?.errors?.['required']) {
      return 'Este campo es requerido.';
    }
    if (telefonoControl?.errors?.['pattern']) {
      return 'Debes ingresar un teléfono válido.';
    }
    return '';
  }

  // Validación Región
  getRegionMessage() {
    const regionControl = this.profileForm.get('region_id');
    if (regionControl?.errors?.['required']) {
      return 'Debes seleccionar una opción.';
    }
    return '';
  }

  // Validación Comuna
  getComunaMessage() {
    const communeControl = this.profileForm.get('commune');
    if (communeControl?.errors?.['required']) {
      return 'Debes seleccionar una opción.';
    }
    return '';
  }

  // Validación Dirección
  getDireccionMessage() {
    const direccionControl = this.profileForm.get('direccion');

    if (direccionControl?.errors?.['required']) {
      return 'Este campo es requerido.';
    }

    if (direccionControl?.errors?.['pattern']) {
      return 'Ingresa una dirección válida.';
    }

    return '';
  }
}