import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Seccion } from '../models/seccion.model';

@Injectable({
  providedIn: 'root'
})
export class SeccionService {

   private apiUrl = 'http://localhost:8888/api/secciones';


  constructor(private http: HttpClient) { }

  // ✅ Obtener todas las secciones de un curso
  listarSeccionesPorCurso(idCurso: number): Observable<Seccion[]> {
    return this.http.get<Seccion[]>(`${this.apiUrl}/curso/${idCurso}`);
  }

  listarSeccionesActivasPorCurso(idCurso: number): Observable<Seccion[]> {
    return this.http.get<Seccion[]>(`${this.apiUrl}/cursoAC/${idCurso}`);
  }

  
  // ✅ Obtener una sección por su ID
  obtenerSeccionPorId(id: number): Observable<Seccion> {
    return this.http.get<Seccion>(`${this.apiUrl}/seccion/${id}`);
  }

  // ✅ Insertar una nueva sección
  insertarSeccion(seccion: Seccion): Observable<string> {
    return this.http.post(`${this.apiUrl}`, seccion, { responseType: 'text' });
  }

  // ✅ Actualizar una sección existente
  actualizarSeccion(id: number, seccion: Seccion): Observable<string> {
    return this.http.put(`${this.apiUrl}/seccion/${id}`, seccion, { responseType: 'text' });
  }

  // ✅ Eliminar (cambiar estado a 0) una sección
  eliminarSeccion(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/seccion/${id}`, { responseType: 'text' });
  }


}
