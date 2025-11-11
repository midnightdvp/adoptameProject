import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { SignupComponent } from './signup/signup.component';
import { MapComponent } from './map/map.component';
import { AccountComponent } from './account/account.component';
import { AdministrationComponent } from './administration/administration.component';
import { AdoptionComponent } from './adoption/adoption.component';
import { AdminPetComponent } from './admin-pet/admin-pet.component';
import { NavstyComponent } from './navsty/navsty.component';
import { LoginComponent } from './login/login.component';
import { RegisterUserOrganizationComponent } from './register-user-organization/register-user-organization.component';
import { LadingOrganizationComponent } from './lading-organization/lading-organization.component';
import { CoincidenceComponent } from './coincidence/coincidence.component';
import { PopupGoogleComponent } from './popup-google/popup-google.component';
import { CatalogoMascotaComponent } from './catalogo-mascota/catalogo-mascota.component';

/* Guardian de rutas */
import { authGuard } from './services/auth.guard';


export const routes: Routes = [
    {path: '', component: HomeComponent},
    {path: 'popup-google', component: PopupGoogleComponent},
    {path: 'signup', component: SignupComponent },
    {path: 'register-user-organization', component: RegisterUserOrganizationComponent },
    {path: 'register-user-organization/:sucursalId', component: RegisterUserOrganizationComponent },
    {path: 'login', component: LoginComponent},
    {path: 'account', component: AccountComponent, canActivate: [authGuard] },
    {path: 'map', component: MapComponent},
    {path: 'administration', component: AdministrationComponent},
    {path: 'adoption', component: AdoptionComponent},
    {path: 'admin-pet', component: AdminPetComponent},
    {path: 'navsty', component: NavstyComponent},
    {path: 'landing-organization', component: LadingOrganizationComponent},
    {path: 'coincidence', component: CoincidenceComponent},
    {path: 'catalogo-mascotas', component: CatalogoMascotaComponent}
];
