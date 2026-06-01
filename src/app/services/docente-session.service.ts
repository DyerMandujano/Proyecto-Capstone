import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DocenteSessionService {

  private keyNombre = 'nombreDelDocente';

  setNombreDocente(nombre: string) {
    localStorage.setItem(this.keyNombre, nombre);
  }

  getNombreDocente(): string {
    return localStorage.getItem(this.keyNombre) || '';
  }

  clearNombreDocente() {
    localStorage.removeItem(this.keyNombre);
  }
}