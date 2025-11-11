import { CommonModule } from '@angular/common';
import { Component} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-register-user-organization',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './register-user-organization.component.html',
  styleUrl: './register-user-organization.component.css'
})
export class RegisterUserOrganizationComponent {
  signupForm: FormGroup;

  regions: any[] = [];
  communes: any[] = [];
  profileImageUrl: string | ArrayBuffer | null = null;

  showModalIn: boolean = false;
  showModalUp: boolean = false;

  token: string | null = null;
  currentSucursalId: string | null = null;

  alertMessage: string | null = null;

  popup: Window | null = null;
  popupInterval: number | null = null;

  isLoggedIn: boolean = false;


  constructor(private router: Router, private formBuilder: FormBuilder, private apiService: ApiService, private route: ActivatedRoute,) {
    this.signupForm = this.formBuilder.group({
      photo: [null, Validators.required],
      google_id: [''],
      email: ['',],
      username: [''],
      password: [''],
      repPassword: [''],
      rut: ['', [Validators.required, Validators.pattern(/^\d{1,2}\.\d{3}\.\d{3}-[\dKk]$/), this.validateRut]],
      name: ['', [Validators.required, Validators.pattern('^(?:[a-zA-ZáéíóúÁÉÍÓÚñÑ]+\\s)+[a-zA-ZáéíóúÁÉÍÓÚñÑ]+$')]],
      telefono: ['9', [Validators.required, Validators.pattern(/^9\d{8}$/)]],
      dateNac: ['', [Validators.required, this.olderAge]],
      region: ['', [Validators.required]],
      commune: ['', [Validators.required]],
      address: ['', [Validators.required, Validators.pattern('^(?=.*\\d{3,4})([a-zA-ZñÑ .]+\\d*)+$')]],
      rol: ['organizacion']
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {

    this.loadRegion();

    this.showModalUp = true;

    // Verificar si window está definido (para entornos donde no está disponible)
    if (typeof window !== 'undefined') {
      // Agregar event listener para recibir mensajes de la ventana emergente
      window.addEventListener('message', this.receiveMessage.bind(this), false);
    }

    this.route.paramMap.subscribe(params => {
      const id = params.get('sucursalId');
      if (id !== null) {
        this.currentSucursalId = id;
        localStorage.setItem('currentSucursalId', id); // Guardar la ID en localStorage
      }
    });

    const storedSucursalId = localStorage.getItem('currentSucursalId');
    if (storedSucursalId !== null) {
      this.currentSucursalId = storedSucursalId; // Recuperar el ID desde localStorage
    } else {
      console.error('No se encontró currentSucursalId en el almacenamiento local');
    }

  }

  // Método para iniciar el proceso de autenticación con Google
  validateGoogle() {
    const redirectUri = window.location.origin + '/popup-google';
    const authUrl = this.apiService.generateGoogleAuthUrl(redirectUri, { prompt: 'select_account' });

    if (typeof window !== 'undefined') {
      this.popup = window.open(authUrl, 'popup-google', 'width=600,height=600');

      this.popupInterval = window.setInterval(() => {
        if (this.popup) {
          if (this.popup.closed) {
            window.clearInterval(this.popupInterval!);
            this.popupInterval = null;
            if (!this.isLoggedIn) {
              this.handleGoogleCancel(); // Cierra el modal solo si no se ha iniciado sesión correctamente
            }
          } else {
            try {
              const url = this.popup.location.href;
              if (url.includes('access_denied')) {
                this.popup.close();
                this.handleGoogleCancel();
              }
            } catch (error) {
              // No hacer nada si hay un error de CORS
            }
          }
        }
      }, 500);
    }
  }

  // Método para recibir el mensaje desde la ventana emergente
  receiveMessage(event: MessageEvent) {
    if (event.origin !== window.location.origin) {
      return;
    }

    const token = event.data.token;
    if (token) {
      this.handleGoogleToken(token);
    }
  }

  // Método para manejar el token de Google después de la autenticación
  handleGoogleToken(token: string): void {
    this.isLoggedIn = true;

    this.apiService.getGoogleUserInfo(token).subscribe(
      (googleUser) => {

        const userEmail = googleUser.email;

        // Validar si el usuario existe en tu backend
        this.apiService.validateUser(userEmail).subscribe(
          response => {
          
            if (response.email_exists) {
              if (response.email_exists.rol === 'adoptante') {

                const profileId = response.email_exists.profile_id
                
                if (confirm('¿Usted ya tiene una cuenta registrada como adoptante si deseas puede cambiar el rol a "organización"?')) {
                  
                  const rol = {
                    rol: 'organizacion'
                  };
                  
                  this.apiService.updateProfile(profileId, rol).subscribe(
                    response => {
                      if (this.currentSucursalId !== null) {
                        // Descifrar la ID antes de usarla en la siguiente solicitud
                        const decryptedId = this.decrypt(this.currentSucursalId);
        
                        // Construir el objeto userOrganizacion con la ID descifrada
                        const userOrganizacion = {
                          sucursal: decryptedId,
                          usuario: response.id,
                        };
        
                        this.apiService.userOrganization(userOrganizacion).subscribe(
                          (response) => {
                            // Eliminar currentSucursalId del localStorage después de usarlo
                            localStorage.removeItem('currentSucursalId');
                            window.alert('¡Registro exitoso! Puede iniciar sesión.');
                            this.navigateToHome();
        
                          },
                          (error) => {
                            console.log('error registro user organizacion:', error);
                          }
                        );
                      }
                    },
                    error => {
                      console.error('Error updating profile:', error);
                      // Mostrar alerta de error
                    }
                  );

                } else {
                  console.log('Cambio de rol cancelado');
                  this.refreshPage();
                }
              } else{
                alert('El usuario con el que usted intenta registrarse no está disponible. Pruebe con otras credenciales.')
              }
            }
          },
          error => {
            if(error) {
              /* Obtener credenciales en caso de estar disponibles */
              const randomPassword = this.generateRandomPassword(12);
              const username = googleUser.email.split('@')[0].replace(/[^a-zA-Z0-9._+-]/g, '');

              this.signupForm.patchValue({
                google_id: googleUser.id,
                email: googleUser.email,
                username: username,
                password: randomPassword,
                repPassword: randomPassword
              });

              this.showModalUp = false;
            }
          }
        );
      },
      (error) => {
        console.error('Error al obtener la información del usuario de Google:', error);
      }
    );
  }

  handleGoogleCancel(): void {
    console.log('Inicio de sesión cancelado.');
    window.location.reload();
  }

  generateRandomPassword(length: number): string {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  }

  // Método para descifrar la ID encriptada
  decrypt(encryptedId: string): number {
    const key = 123; // La misma clave utilizada en el cifrado
    const decryptedId = parseInt(encryptedId, 10) ^ key; // Convertir a número y aplicar XOR
    return decryptedId;
  }

  onSubmit(): void {
    if (this.signupForm.valid) {

      const credentialsData = {
        email: this.signupForm.value.email,
        username: this.signupForm.value.username,
        password1: this.signupForm.value.password,
        password2: this.signupForm.value.repPassword,
      };
      console.log(credentialsData);

      this.apiService.registerUser(credentialsData).subscribe(
        (response) => {
          const token = response.tokens.access;
          const formData = new FormData();

          const userDetailsData = {
            google_id: this.signupForm.value.google_id,
            rut: this.signupForm.value.rut,
            nombre_apellido: this.signupForm.value.name,
            telefono: this.signupForm.value.telefono,
            fecha_nacimiento: this.signupForm.value.dateNac,
            domicilio: this.signupForm.value.address,
            rol: this.signupForm.value.rol,
            comuna: this.signupForm.value.commune,
          };

          Object.entries(userDetailsData).forEach(([key, value]) => {
            formData.append(key, value as string);
          });

          const photo = this.signupForm.get('photo')?.value;
          if (photo instanceof File) {
            formData.append('foto_perfil', photo, photo.name);
          }
          console.log(formData)
          this.apiService.registerUserDetails(formData, token).subscribe(
            (response) => {
              if (this.currentSucursalId !== null) {
                // Descifrar la ID antes de usarla en la siguiente solicitud
                const decryptedId = this.decrypt(this.currentSucursalId);

                // Construir el objeto userOrganizacion con la ID descifrada
                const userOrganizacion = {
                  sucursal: decryptedId,
                  usuario: response.id,
                };

                this.apiService.userOrganization(userOrganizacion).subscribe(
                  (response) => {
                    // Eliminar currentSucursalId del localStorage después de usarlo
                    localStorage.removeItem('currentSucursalId');
                    window.alert('¡Registro exitoso! Puede iniciar sesión.');
                    this.navigateToHome();

                  },
                  (error) => {
                    console.log('error registro user organizacion:', error);
                  }
                );
              }
            },
            (error) => {
              console.error('Error al registrar los detalles del usuario:', error);
            }
          );
        },
        (error) => {
          console.error('Error al registrar las credenciales del usuario:', error);
        }
      );
    } else {
      console.log('Formulario no válido');
    }
  }

  openModalUp() {
    this.showModalUp = true;
  }

  closeModalUp() {
    this.showModalUp = false;
  }

  navigateToURL(url: string): void {
    this.router.navigateByUrl(url);
  }

  //Cargar Regiones y Comunas
  loadRegion(): void {
    this.apiService.getRegions().subscribe(
      (data: any[]) => {
        this.regions = data;
      },
      (error: any) => {
        console.error('Error al cargar regiones:', error);
      }
    );
  }

  loadComuna(region: number): void {
    this.apiService.getCommunes(region).subscribe(
      (data: any[]) => {
        this.communes = data;
      },
      (error: any) => {
        console.error('Error al cargar comunas:', error);
      }
    );
  }

  onRegionChange(event: any): void {
    const selectedRegionId = this.signupForm.get('region')?.value;
    this.loadComuna(selectedRegionId);
  }

  //Validación foto de perfil
  getPhotoMessage() {
    const photoControl = this.signupForm.get('photo');
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
      this.signupForm.patchValue({ photo: file });
      this.signupForm.get('photo')?.updateValueAndValidity();
    }
  }

  // Validación Email
  getEmailMessage() {
    const emailControl = this.signupForm.get('email');

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

    this.signupForm.get('phone')?.setValue(value, { emitEvent: false });
  }

  getTelefonoMessage() {
    const phoneControl = this.signupForm.get('phone');

    if (phoneControl?.errors?.['required']) {
      return 'Este campo es requerido.';
    }
    if (phoneControl?.errors?.['pattern']) {
      return 'Debes ingresar un teléfono válido.';
    }
    return '';
  }

  // Validación Contraseña
  getPasswordMessage() {
    const passwordControl = this.signupForm.get('password');

    if (passwordControl?.errors?.['required']) {
      return 'Este campo es requerido.';
    }
    if (passwordControl?.errors?.['minlength']) {
      return 'La contraseña debe tener al menos 8 caracteres.';
    }

    if (passwordControl?.errors?.['maxlength']) {
      return 'La contraseña debe tener como máximo 25 caracteres.';
    }
    if (passwordControl?.errors?.['pattern']) {
      return 'La contraseña debe contener al menos una letra mayúscula, un número y un carácter especial.';
    }

    return '';
  }

  // Validador para comparar las contraseñas
  passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const repPassword = formGroup.get('repPassword')?.value;

    if (password !== repPassword) {
      formGroup.get('repPassword')?.setErrors({ 'passwordMismatch': true });
    } else {
      formGroup.get('repPassword')?.setErrors(null);
    }
  }

  // Validación Repetir Contraseña
  getRepPasswordMessage() {
    const repPasswordControl = this.signupForm.get('repPassword');

    if (repPasswordControl?.errors?.['required']) {
      return 'Este campo es requerido.';
    }

    const password = this.signupForm.get('password')?.value;
    const repPassword = this.signupForm.get('repPassword')?.value;

    if (password !== repPassword) {
      return 'Las contraseñas no coinciden.';
    }

    return '';
  }

  // Validación RUT
  getRutMessage() {
    const rutControl = this.signupForm.get('rut');

    if (rutControl?.errors?.['required']) {
      return 'Este campo es requerido.';
    }
    if (rutControl?.errors?.['pattern']) {
      return 'Ingresa un RUT válido.';
    }
    if (rutControl?.errors?.['rutInvalido']) {
      return 'RUT inválido.';
    }
    return '';
  }

  formatRut(event: any) {
    let value = event.target.value.replace(/[^\dKk]/g, '');

    // Si hay una "k" antes del último dígito, la eliminamos
    value = value.slice(0, -1).replace(/k/gi, '') + value.slice(-1);

    let formattedRut = '';

    if (value.length > 9) {
      value = value.slice(0, 9);
    }

    if (value.length > 0) {
      formattedRut = value.slice(0, -1).replace(/^(\d{1,2})(\d{3})(\d{3})/, '$1.$2.$3') + '-' + value.slice(-1);
      // Convertir la última letra a mayúscula si es "k"
      if (value.slice(-1).toLowerCase() === 'k') {
        formattedRut = formattedRut.slice(0, -1) + 'K';
      }
    }

    this.signupForm.get('rut')?.setValue(formattedRut, { emitEvent: false });
  }

  // Validador de RUT
  validateRut(control: any) {
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

  // Validación Nombre completo
  getNameMessage() {
    const nameControl = this.signupForm.get('name');

    if (nameControl?.errors?.['required']) {
      return 'Este campo es requerido.';
    }

    if (nameControl?.errors?.['pattern']) {
      return 'Ingresa al menos un nombre y un apellido.';
    }

    return '';
  }


  // Validación Fecha de nacimiento
  olderAge(control: any) {
    const dateNac = new Date(control.value);
    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

    if (dateNac > eighteenYearsAgo) {
      return { olderAge: true };
    }

    return null;
  }

  getDateNacMessage() {
    const dateNacControl = this.signupForm.get('dateNac');

    if (dateNacControl?.errors?.['required']) {
      return 'Este campo es requerido.';
    }
    if (dateNacControl?.errors?.['olderAge']) {
      return 'Debes ser mayor de 18 años para registrarte.';
    }
    return '';
  }

  // Validación Región
  getRegionMessage() {
    const regionControl = this.signupForm.get('region');
    if (regionControl?.errors?.['required']) return 'Debes seleccionar una opción.';
    return '';
  }

  // Validación Comuna
  getCommuneMessage() {
    const communeControl = this.signupForm.get('commune');
    if (communeControl?.errors?.['required']) return 'Debes seleccionar una opción.';
    return '';
  }

  // Validación Dirección
  getAddressMessage() {
    const addressControl = this.signupForm.get('address');

    if (addressControl?.errors?.['required']) {
      return 'Este campo es requerido.';
    }

    if (addressControl?.errors?.['pattern']) {
      return 'Ingresa una dirección válida.';
    }

    return '';
  }

  refreshPage(): void {
    window.location.reload();
  }

  navigateToHome(): void {
    this.router.navigate(['/']).then(() => {
      window.location.reload();
    });
  }
}
