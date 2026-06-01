import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Estudiante } from '../models/estudiante.model'; // <-- ¡Este archivo ya existe!
import { CursoMatricula } from '../models/CursoMatricula';

@Injectable({
  providedIn: 'root'
})
export class EstudianteService {

  // Asegúrate de que el puerto (8888 o 8080) sea el correcto
  private apiUrl = 'http://localhost:8888/api/estudiantes';
  private apiUrl2 = 'http://localhost:8888/api/cursos/matricula/estudiante'

  constructor(private http: HttpClient) { }

  /**
   * Llama a tu endpoint: GET /api/estudiantes
   */
  listarEstudiantes(): Observable<Estudiante[]> {
    return this.http.get<Estudiante[]>(this.apiUrl);
  }

  /**
   * Llama a tu endpoint: GET /api/estudiantes/{idEstudiante}
   */
  obtenerEstudiante(id: number): Observable<Estudiante> {
    const url = `${this.apiUrl}/${id}`; 
    return this.http.get<Estudiante>(url);
  }

  obtenerCursosMatricula(id:number):Observable<CursoMatricula[]>
  {
    return this.http.get<CursoMatricula[]>(`${this.apiUrl2}/${id}`);
  }
}