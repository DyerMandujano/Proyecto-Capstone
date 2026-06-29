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

  // 🔹 Obtener todas las lecciones por ID de Sección
  listarLeccionesPorSeccion(idSeccion: number): Observable<Leccion[]> {
    return this.http.get<Leccion[]>(`${this.apiUrl}/seccion/${idSeccion}`);
  }

  // 🔹 Obtener una lección por su ID
  obtenerLeccionPorId(id: number): Observable<Leccion> {
    return this.http.get<Leccion>(`${this.apiUrl}/leccion/${id}`);
  }

  // 🔹 Insertar nueva lección
  insertarLeccion(leccion: Leccion): Observable<string> {
    return this.http.post(`${this.apiUrl}`, leccion, { responseType: 'text' });
  }

  // 🔹 Actualizar lección existente (MODIFICADO PARA SUBIR ARCHIVOS FÍSICOS)
  actualizarLeccion(id: number, leccion: Leccion): Observable<string> {
    const formData = new FormData();
    
    // 1. Convertimos los datos de la lección (texto) a un Blob tipo JSON
    formData.append('leccion', new Blob([JSON.stringify(leccion)], { type: 'application/json' }));

    // 2. Revisamos si hay archivos seleccionados desde la computadora y los adjuntamos
    if (leccion.materiales) {
      leccion.materiales.forEach((material) => {
        if (material.archivoFisico) {
          formData.append('archivos', material.archivoFisico, material.archivoFisico.name);
        }
      });
    }

    // 3. Enviamos el "paquete" (FormData) por PUT en lugar de mandar el objeto directo
    return this.http.put(`${this.apiUrl}/leccion/${id}`, formData, { responseType: 'text' });
  }

  // 🔹 Eliminar (cambiar estado) de una lección por ID
  eliminarLeccion(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/leccion/${id}`, { responseType: 'text' });
  }
}