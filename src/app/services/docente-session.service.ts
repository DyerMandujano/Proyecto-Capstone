import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DocenteSessionService {

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
