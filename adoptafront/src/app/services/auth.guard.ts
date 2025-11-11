import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { StorageService } from './storage.service';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const storageService = inject(StorageService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (isPlatformBrowser(platformId)) {
    const token = storageService.getAccessToken();
    if (token) {
      // Opcional: Puedes añadir lógica para verificar la validez del token
      return true;
    }
    router.navigate(['/']);
    return false;
  }
  return false;
};
