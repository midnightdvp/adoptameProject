import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-navsty',
  standalone: true,
  templateUrl: './navsty.component.html',
  styleUrl: './navsty.component.css'
})
export class NavstyComponent implements OnInit {
  userRol: any;
  adoptante: boolean;
  admin: boolean;
  tabla: boolean;
  organizacion: boolean;
  constructor(private router:Router, private storageService: StorageService){
    this.adoptante = false;
    this.admin = false;
    this.tabla = false;
    this.organizacion = false;
  }
  ngOnInit(): void {
    this.userRol = this.storageService.getUserRole();
    console.log("Rol:"+ this.userRol);
    if(this.userRol === "adoptante"){
      this.adoptante = true;
    }else if (this.userRol === "admin"){
      this.admin = true;
    }else if (this.userRol === "organizacion"){
      this.organizacion = true;
    }
    console.log("Admin: " + this.admin + "  Adoptante: " + this.adoptante + "  Organizacion: " + this.organizacion)
  }
  navigateToURL(url: string): void {
    this.router.navigateByUrl(url);
  }
  tablaOn(): void{
    this.tabla = true;
  }
  refreshPage(): void {
    window.location.reload();
  }
}
