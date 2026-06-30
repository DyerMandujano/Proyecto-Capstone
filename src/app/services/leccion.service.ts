import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Leccion } from '../models/leccion.model';

@Injectable({
  providedIn: 'root'
})
export class LeccionService {

  private apiUrl = 'http://localhost:8888/api/lecciones';

  constructor(private http: HttpClient) {}

  listarLeccionesPorSeccion(idSeccion: number): Observable<Leccion[]> {
    return this.http.get<Leccion[]>(`${this.apiUrl}/seccion/${idSeccion}`);
  }

  // 🔹 CORRECCIÓN: Ruta arreglada para que coincida con el backend
  obtenerLeccionPorId(id: number): Observable<Leccion> {
    return this.http.get<Leccion>(`${this.apiUrl}/${id}`);
  }

insertarLeccion(leccion: Leccion): Observable<string> {
    const formData = new FormData();
    formData.append('leccion', new Blob([JSON.stringify(leccion)], { type: 'application/json' }));

    if (leccion.materiales) {
      leccion.materiales.forEach((material) => {
        if (material.archivoFisico) {
          formData.append('archivos', material.archivoFisico, material.archivoFisico.name);
        }
      });
    }
    return this.http.post(`${this.apiUrl}`, formData, { responseType: 'text' });
  }

  actualizarLeccion(id: number, leccion: Leccion): Observable<string> {
    const formData = new FormData();
    
    // Convertimos la lección a JSON Blob
    formData.append('leccion', new Blob([JSON.stringify(leccion)], { type: 'application/json' }));

    if (leccion.materiales) {
      leccion.materiales.forEach((material) => {
        if (material.archivoFisico) {
          formData.append('archivos', material.archivoFisico, material.archivoFisico.name);
        }
      });
    }

    // 🔹 CORRECCIÓN: Ruta arreglada
    return this.http.put(`${this.apiUrl}/${id}`, formData, { responseType: 'text' });
  }

  eliminarLeccion(id: number): Observable<string> {
    // 🔹 CORRECCIÓN: Ruta arreglada
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
  }
}