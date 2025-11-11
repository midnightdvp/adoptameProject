import { Component, Inject, OnInit, PLATFORM_ID, OnDestroy } from '@angular/core';
import { NavstyComponent } from '../navsty/navsty.component';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { EventService } from '../services/event.service';
import { StorageService } from '../services/storage.service';
import { ApiService } from '../services/api.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [NavstyComponent, CommonModule, ReactiveFormsModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit, OnDestroy {
  private map: any;
  eventDetail: any;
  userName: any;
  emergencia = false;
  isButtonEnabled = false;
  userResponsable: any;
  sucursalResponsable: any;
  private centroid: any = [-33.363464987148866, -70.67817107673305];
  private L: any;
  private userEmail: string | null = null;
  telefono: string | null = null;
  private pollingInterval: any;
  userRol: any;
  userAdoptante = false;
  userOrganizacion = false;
  popUserAdoptante = false;
  inProgessEvent = false;
  adoptanteProcess = false;
  orgProcess = false;
  sucursalId: any
  nombreUser: any;
  sucursalNombre: any;
  regions: any[] = [];
  communes: any[] = [];
  eventForm: FormGroup;
  events: any[] = [];
  selectedEventId: any;
  sucursalData: any;
  organizacionData: any;
  alertKind = [
    { id: 'Accidente', nombre: 'Accidente relacionado a una Mascota' },
    { id: 'Abandono', nombre: 'Abandono de una Mascota' }
  ];
  currentIndex: number = 0; // Índice del evento actual
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private eventService: EventService,
    private storageService: StorageService,
    private apiService: ApiService
  ) {
    this.emergencia = false;
    this.eventForm = this.formBuilder.group({
      tipoEmergencia: [''],
      region: [''],
      commune: [''],
    });
  }

  ngOnInit(): void {
    this.userRol = this.storageService.getUserRole();
    if (this.userRol === "organizacion") {
      this.orgProcess = true;
      //Aqui deberia traer la sucursal del usuario que esta conectado
    } else if (this.userRol === "adoptante") {
      this.adoptanteProcess = false;
    }
    this.loadRegion();
    if (isPlatformBrowser(this.platformId)) {
      const userId = this.storageService.getUserId();
      if (userId) {
        this.apiService.getUserDetails(userId).subscribe((userDetails: any) => {
          this.userEmail = userDetails.email;
          this.nombreUser = userDetails.nombre_apellido;
          this.telefono = userDetails.telefono;
          this.apiService.getSucursalUser(userId).subscribe(
            (data: any) => {
              if (data.length > 0) {
                // Asignar los datos del primer elemento del array
                this.sucursalData = data[0];
                this.organizacionData = data[0].organizacion;
                this.sucursalId = data[0].id;
                this.sucursalNombre = data[0].nombre_sucursal;
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
        });

        import('leaflet').then((leafletModule) => {
          this.L = leafletModule;
          this.initMap();
          this.loadGeoJSONVet();
          this.loadGeoJSONPetShop();
          this.loadGeoJSONPetCare();
          this.startPolling();
          this.markCurrentLocation();
          this.eventService.getActiveEvents().subscribe((events: any[]) => {
            console.log('Received events:', events); // Verificar los datos recibidos
            events.forEach((event: any) => {
              if (event.activo && event.lat !== undefined && event.lng !== undefined) {
                this.addMarker(event.lat, event.lng, event.idEvento);
              } else {
                console.warn('Event has missing coordinates:', event); // Advertir si faltan coordenadas
              }
            });
          });
        });
      }
    }
  }
  ngOnDestroy(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }
  enableButton(): void {
    this.isButtonEnabled = true;

  }
  private playAlertSound(): void {
    const audio = new Audio('assets/sounds/Efecto de sonido campana.mp3');
    audio.volume = 0.4; // Ajusta el volumen aquí (0.2 es 20% del volumen máximo)
    audio.play().catch(error => console.error('Error al reproducir el sonido:', error));
    audio.play().catch(error => console.error('Error al reproducir el sonido:', error));
  }
  buttonActionContinue(): void {
    //Patch IdSucursall
    if (this.selectedEventId && this.sucursalData) {
      const updatedData = {
        IdSucursal: this.sucursalId,
        activo: false,
        fechaResolucion: new Date(),
        resolucionDescripcion: 'Debe rellenar con la resolucion del caso'
      };

      this.eventService.updateEvent(this.selectedEventId, updatedData).subscribe(response => {
        console.log('Evento actualizado:', response);
        this.startPolling();
        this.calmAdoptante();
        this.refreshPage();
        console.log('Todo tranquilo por aquí...');
      }, (error) => {
        console.error('Error al actualizar el evento:', error);
      });
    } else {
      console.warn('No se ha seleccionado ningún evento o no se ha obtenido la sucursal.');
    }
  }
  private initMap(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.map = this.L.map('map', {
        zoom: 20,
      });
      this.L.tileLayer('http://{s}.google.com/vt?lyrs=m&x={x}&y={y}&z={z}', {
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
      }).addTo(this.map);
    }
  }
  confirmZone(tryAlert: boolean) {
    this.popUserAdoptante = tryAlert;
  }
  private loadGeoJSONVet(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.http.get('assets/dataMap/map.geojson').subscribe((geoJsonData: any) => {
        this.L.geoJSON(geoJsonData, {
          pointToLayer: (feature: any, latlng: any) => {
            const customIcon = this.L.icon({
              iconUrl: 'assets/images/Map/veterinario.png', // Reemplaza con la ruta de tu icono
              iconSize: [45, 45], // Tamaño del icono
              iconAnchor: [25, 50], // Punto del icono que corresponde a la ubicación del marcador
              popupAnchor: [0, -50] // Punto desde donde se abrirá el popup relativo al icono
            });
            return this.L.marker(latlng, { icon: customIcon });
          },
          onEachFeature: (feature: any, layer: any) => {
            if (feature.properties && feature.properties.popupContent) {
              layer.bindPopup(feature.properties.popupContent);
            }
          }
        }).addTo(this.map);
      });
    }
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
    const selectedRegionId = this.eventForm.get('region')?.value;
    this.loadComuna(selectedRegionId);
  }
  private loadGeoJSONPetShop(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.http.get('assets/dataMap/map shop.geojson').subscribe((geoJsonData: any) => {
        this.L.geoJSON(geoJsonData, {
          pointToLayer: (feature: any, latlng: any) => {
            const customIcon = this.L.icon({
              iconUrl: 'assets/images/Map/petShopIcon.png', // Reemplaza con la ruta de tu icono
              iconSize: [45, 45], // Tamaño del icono
              iconAnchor: [25, 50], // Punto del icono que corresponde a la ubicación del marcador
              popupAnchor: [0, -50] // Punto desde donde se abrirá el popup relativo al icono
            });
            return this.L.marker(latlng, { icon: customIcon });
          },
          onEachFeature: (feature: any, layer: any) => {
            if (feature.properties && feature.properties.popupContent) {
              layer.bindPopup(feature.properties.popupContent);
            }
          }
        }).addTo(this.map);
      });
    }
  }

  private loadGeoJSONPetCare(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.http.get('assets/dataMap/pet care.geojson').subscribe((geoJsonData: any) => {
        this.L.geoJSON(geoJsonData, {
          pointToLayer: (feature: any, latlng: any) => {
            const customIcon = this.L.icon({
              iconUrl: 'assets/images/Map/petCareIcon.png', // Reemplaza con la ruta de tu icono
              iconSize: [45, 45], // Tamaño del icono
              iconAnchor: [25, 50], // Punto del icono que corresponde a la ubicación del marcador
              popupAnchor: [0, -50] // Punto desde donde se abrirá el popup relativo al icono
            });
            return this.L.marker(latlng, { icon: customIcon });
          },
          onEachFeature: (feature: any, layer: any) => {
            if (feature.properties && feature.properties.popupContent) {
              layer.bindPopup(feature.properties.popupContent);
            }
          }
        }).addTo(this.map);
      });
    }
  }

  private addMarker(lat: number, lng: number, idEvento: number): void {
    this.userRol = this.storageService.getUserRole();
    if (isPlatformBrowser(this.platformId)) {
      const customIcon = this.L.icon({
        iconUrl: 'assets/images/Map/Alerta.png',
        iconSize: [50, 50],
        iconAnchor: [20, -10],
        popupAnchor: [5, 15]
      });
      const marker = this.L.marker([lat, lng], { icon: customIcon }).addTo(this.map);
      // Centrar el mapa en las coordenadas del nuevo marcador
      this.map.setView([lat, lng], this.map.getZoom());

      marker.bindPopup('<h5>¡Emergencia!</h5>').openPopup();
      // Obtener el elemento HTML del icono y añadir la clase de parpadeo
      const markerElement = marker.getElement();
      if (markerElement) {
        markerElement.classList.add('blinking-icon');
      }
      // Agrega un evento para abrir Google Maps cuando el usuario de la organización haga clic
      marker.on('click', () => {
        if (this.userRol === 'organizacion') {
          const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
          window.open(googleMapsUrl, '_blank');
        }
      });
    }
  }
  private startPolling(): void {
    this.userRol = this.storageService.getUserRole();
    this.pollingInterval = setInterval(() => {
      this.eventService.getActiveEvents().subscribe((events: any[]) => {
        this.events = events;
        
        console.log('Received events during polling:', events); // Verificar los datos recibidos
        console.log('[--]ShErIff[--]')
        console.log("Cantidad de emergencias: " + events.length);
        if (events.length > 0) {
          // Obtener los detalles del evento activo o el primer evento inactivo sin responsable
          const activeEvent = events.find(event => event.activo === true);
          const pendingEvent = events.find(event => event.activo === false && event.userResponsable === 'No Encontrado');
          const eventToSelect = activeEvent || pendingEvent;
          if (eventToSelect) {
            this.selectedEventId = eventToSelect.idEvento;
            this.getEvent(this.selectedEventId);
          }
          if (this.userRol === "organizacion") {
            if (eventToSelect.sucursal === "Sin Respuesta") {
              this.playAlertSound();
              this.userOrganizacion = true;
              this.userAdoptante = false;
            }
          } else if (this.userRol === "adoptante") {
            if (eventToSelect.sucursal !== "Sin Respuesta") {
              this.userAdoptante = false;
              this.userOrganizacion = false;
            }
          }

        } else {
          this.userAdoptante = false;
          this.userOrganizacion = false;
        }
        events.forEach((event: any) => {
          if (event.activo && event.lat !== undefined && event.lng !== undefined) {
            this.calmAdoptante();
            this.addMarker(event.lat, event.lng, event.idEvento);
          } else {
            console.warn('Event has missing coordinates:', event); // Advertir si faltan coordenadas
          }
        });
      }, (error) => {
        console.error('Error during polling:', error);
      });
    }, 2000); // Polling cada 2 segundos
  }
  calmAdoptante() {
    this.adoptanteProcess = true;
  }
  createEvent(lat: number, lng: number): void {
    this.userRol = this.storageService.getUserRole();
    if (this.userRol === "adoptante") {
      this.popUserAdoptante = true;
      this.userAdoptante = true;
    }
    const formValues = this.eventForm.value;

    const newEvent = {
      tipoEvento: formValues.tipoEmergencia,
      userReportante: this.nombreUser,
      userResponsable: 'No Encontrado',
      mailUserReportante: this.userEmail,
      mailUserResponsable: 'No Encontrado',
      sucursal: 'Sin Respuesta',
      comuna: formValues.commune,
      region: formValues.region,
      fechaEvento: new Date(),
      activo: true,
      IdSucursal: '',
      lat: lat,
      lng: lng
    };

    console.log('Creating event with data:', newEvent);

    this.eventService.createEvent(newEvent).subscribe((response: any) => {
      console.log('Evento creado:', response);
      this.addMarker(lat, lng, response.idEvento);
    }, (error) => {
      console.error('Error al crear el evento:', error);
    });
  }
  selectEvent(idEvento: number): void {
    this.selectedEventId = idEvento;
    console.log('Evento seleccionado:', idEvento);
  }
  getEvent(idEvento: number): void {
    this.eventService.getEventById(idEvento).subscribe(
      (event) => {
        this.eventDetail = event;
        this.userResponsable = event.userResponsable;
        this.sucursalResponsable = event.sucursal;
        console.log('Detalles del evento:', this.eventDetail);
      },
      (error) => {
        console.error('Error fetching event:', error);
      }
    );
  }
  refreshPage(): void {
    window.location.reload();
  }

  updateEvent(idEvento: number): void {
    if (idEvento !== null) {
      const updatedData = {
        userResponsable: this.nombreUser,
        mailUserResponsable: this.userEmail,
        sucursal: this.sucursalNombre,
        fechaResolucion: new Date(),
        resolucionDescripcion: 'Descripción de la resolución'
      };
      this.startPolling();
      this.eventService.updateEvent(idEvento, updatedData).subscribe(response => {
        console.log('Evento actualizado:', response);
        this.inProgessEvent = true;
        this.userAdoptante = false;
        this.userOrganizacion = false;
        this.popUserAdoptante = false;
      }, (error) => {
        console.error('Error al actualizar el evento:', error);
      });
    } else {
      console.warn('No se ha seleccionado ningún evento para actualizar');
    }
  }

  // Navegar al evento anterior
  previousEvent(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  // Navegar al siguiente evento
  nextEvent(): void {
    if (this.currentIndex < this.events.length - 1) {
      this.currentIndex++;
    }
  }

  addMarkerAtCurrentLocation(): void {
    if (isPlatformBrowser(this.platformId)) {
      import('leaflet').then((L) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            this.createEvent(lat, lng);
            this.emergencia = true;
            this.popUserAdoptante = false;
            console.log("Es una emergencia:" + this.emergencia);
          }, (error) => {
            console.error('Error obteniendo la ubicación: ', error);
          });
        } else {
          console.error('Geolocalización no es soportada por este navegador.');
        }
      });
    }
  }

  private markCurrentLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const currentLocationIcon = this.L.icon({
          iconUrl: '/assets/images/home/icons8-location-100.png',
          iconSize: [45, 45],
          iconAnchor: [15, 15]
        });
        const marker = this.L.marker([lat, lng], { icon: currentLocationIcon }).addTo(this.map);
        this.map.setView([lat, lng], 15); // Centra el mapa en la ubicación actual con un zoom de 15
        marker.bindPopup('<h5>Tu ubicación actual</h5>').openPopup();
      }, (error) => {
        console.error('Error obteniendo la ubicación: ', error);
      });
    } else {
      console.error('Geolocalización no es soportada por este navegador.');
    }
  }
}

