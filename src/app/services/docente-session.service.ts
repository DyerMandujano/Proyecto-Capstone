import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class DocenteSessionService {

<<<<<<< HEAD
  // 1. Inyectamos PLATFORM_ID en el constructor
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  getNombreDocente() {
    // 2. Verificamos si estamos en el navegador antes de usar localStorage
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('nombreDocente'); // Usa la llave que tengas definida
    }
    return null; // Retorna null o '' si se está renderizando en el servidor
  }

  setNombreDocente(nombre: string) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('nombreDocente', nombre);
    }
  }

  // EJEMPLO: Si tienes un método para guardar o leer el token, haz lo mismo:
  getToken() {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
=======
  private keyNombre = 'nombreDelDocente';
  private keyIdDocente = 'idDocente';

  setNombreDocente(nombre: string): void {
    localStorage.setItem(this.keyNombre, nombre);
  }

  getNombreDocente(): string {
    return localStorage.getItem(this.keyNombre) || '';
  }

  setIdDocente(id: number): void {
    if (id && id > 0) {
      localStorage.setItem(this.keyIdDocente, id.toString());
    }
>>>>>>> main
  }

  getIdDocente(): number {
    const id = localStorage.getItem(this.keyIdDocente);
    return id ? Number(id) : 0;
  }

  clearNombreDocente(): void {
    localStorage.removeItem(this.keyNombre);
    localStorage.removeItem(this.keyIdDocente);
  }
}
