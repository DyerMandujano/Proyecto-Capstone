import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Certificado } from '../models/certificado.model';

@Injectable({
  providedIn: 'root'
})
export class CertificadoService {
  // Asegúrate que el puerto sea el correcto (8888 o 8080 según tu backend)
  private apiUrl = 'http://localhost:8888/api/certificados';

  constructor(private http: HttpClient) { }

  // ESTE ES EL MÉTODO QUE TE FALTA
  generarCertificado(idEstudiante: number, idCurso: number): Observable<Certificado> {
    const params = new HttpParams()
      .set('idEstudiante', idEstudiante)
      .set('idCurso', idCurso);

    // Usamos POST para que el backend genere y guarde el certificado si no existe
    return this.http.post<Certificado>(`${this.apiUrl}/generar`, null, { params });
  }
  listarCertificadosPorEstudiante(idEstudiante: number): Observable<any[]> {
    // Asegúrate de que esta ruta coincida con tu Backend
    return this.http.get<any[]>(`${this.apiUrl}/estudiante/${idEstudiante}`);
  }
}