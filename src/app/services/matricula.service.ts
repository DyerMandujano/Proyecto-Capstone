import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Matricula } from '../models/matricula';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MatriculaService {

  private apiUrl = 'http://localhost:8888/api/matriculas';
  constructor(private http: HttpClient) { }


 // 🔹 Insertar matrícula usando parámetros (idEstudiante, idCurso)
 insertarMatricula(idEstudiante: number, idCurso: number): Observable<string> {
  const params = new HttpParams()
    .set('idEstudiante', idEstudiante)
    .set('idCurso', idCurso);

  return this.http.post(`${this.apiUrl}/insertar`, null, {
    params,
    responseType: 'text'
  });
}
}
