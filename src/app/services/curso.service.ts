import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Curso } from '../models/curso.model';
import { DocenteC } from '../models/docenteC.model';
import { CursoNoMatricula } from '../models/CursoNoMatricula';

@Injectable({
  providedIn: 'root'
})
export class CursoService {
  private apiUrl = 'http://localhost:8888/api/docentes';
  
  private apiUrl2 = 'http://localhost:8888/api/cursos/docente';

   private apiUrl3 = 'http://localhost:8888/api/cursos';
 private apiUrl4 = 'http://localhost:8888/api/cursos/no-matricula';

  constructor(private http: HttpClient) {}

  /*
  listarCursos(): Observable<Curso[]> {
    return this.http.get<Curso[]>(this.apiUrl2);
  }*/
 

    listarCursos(): Observable<Curso[]> {
    return this.http.get<Curso[]>(this.apiUrl3);
  }

  listarCursosSinMatriculaporEstu(id: number): Observable<CursoNoMatricula[]> {
    return this.http.get<CursoNoMatricula[]>(`${this.apiUrl4}/${id}`);
  }


  listarDocentes(): Observable<DocenteC[]> {
    return this.http.get<DocenteC[]>(this.apiUrl);
  }

  listarCursosPorDocente(idDocente: number): Observable<Curso[]> {
  return this.http.get<Curso[]>(`${this.apiUrl2}/${idDocente}`);
  }

  obtenerCursoPorId(id: number): Observable<Curso> {
    return this.http.get<Curso>(`${this.apiUrl3}/${id}`);
  }

  insertarCurso(curso: Curso): Observable<string> {
    return this.http.post(this.apiUrl3, curso, { responseType: 'text' });
  }

  actualizarCurso(id: number, curso: Curso): Observable<string> {
    return this.http.put(`${this.apiUrl3}/${id}`, curso, { responseType: 'text' });
  }

  eliminarCurso(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl3}/${id}`, { responseType: 'text' });
  }



}

