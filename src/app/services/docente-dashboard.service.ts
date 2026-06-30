import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface CertificadoPorCurso {
  nombreCurso: string;
  cantidad: number;
}

export interface RankingCurso {
  nombreCurso: string;
  totalEstudiantes: number;
}

export interface Tendencia {
  anio: number;
  cantidad: number;
}

export interface EstudiantePorCurso {
  nombreCurso: string;
  totalEstudiantes: number;
  anio: number;
}

@Injectable({
  providedIn: 'root'
})
export class DocenteDashboardService {
  private apiUrl = 'http://localhost:8888/api/docente-dashboard';

  constructor(private http: HttpClient) {
    console.log('DocenteDashboardService inicializado');
  }

  getCertificadosPorCurso(idDocente: number): Observable<any[]> {
    console.log('Llamando a API: certificados-por-curso/', idDocente);
    return this.http.get<any[]>(`${this.apiUrl}/certificados-por-curso/${idDocente}`);
  }

  getRankingCursos(idDocente: number): Observable<any[]> {
    console.log('Llamando a API: ranking-cursos/', idDocente);
    return this.http.get<any[]>(`${this.apiUrl}/ranking-cursos/${idDocente}`);
  }

  getTendenciaCertificados(idDocente: number): Observable<any[]> {
    console.log('Llamando a API: tendencia-certificados/', idDocente);
    return this.http.get<any[]>(`${this.apiUrl}/tendencia-certificados/${idDocente}`);
  }

  getTendenciaMatriculas(idDocente: number): Observable<any[]> {
    console.log('Llamando a API: tendencia-matriculas/', idDocente);
    return this.http.get<any[]>(`${this.apiUrl}/tendencia-matriculas/${idDocente}`);
  }

  getEstudiantesPorCurso(idDocente: number): Observable<any[]> {
    console.log('Llamando a API: estudiantes-por-curso/', idDocente);
    return this.http.get<any[]>(`${this.apiUrl}/estudiantes-por-curso/${idDocente}`);
  }
}
