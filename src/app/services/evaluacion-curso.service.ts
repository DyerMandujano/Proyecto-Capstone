import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EvaluacionCurso } from '../models/evaluacionCurso';
import { Evaluacion } from '../models/evaluacion';

@Injectable({
  providedIn: 'root'
})
export class EvaluacionCursoService {

  private apiUrl = 'http://localhost:8888/api/evaluacion';
  private apiUrl2 = 'http://localhost:8888/api/evaluaciones';

  constructor(private http: HttpClient) { }

  // Obtener la evaluación de una sección
  listarEvaluacion(idSeccion: number): Observable<EvaluacionCurso[]> {
    return this.http.get<EvaluacionCurso[]>(`${this.apiUrl}/seccion/${idSeccion}`);
  }

  listarTituloEvaluacion(idSeccion: number): Observable<Evaluacion[]> {
    return this.http.get<Evaluacion[]>(`${this.apiUrl2}/seccion/${idSeccion}`);
  }

}
