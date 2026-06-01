import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Persona } from '../models/persona.model'; // <-- Importa el modelo

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private apiUrl = 'http://localhost:8888/api/usuarios';

  constructor(private http: HttpClient) { }

  // ¡ESTE ES EL MÉTODO QUE FALTABA!
  obtenerPerfil(id: number): Observable<Persona> {
    return this.http.get<Persona>(`${this.apiUrl}/perfil/${id}`);
  }

  // ¡ESTE TAMBIÉN FALTABA!
  actualizarPerfil(id: number, persona: Persona): Observable<string> {
    return this.http.put(`${this.apiUrl}/perfil/${id}`, persona, { responseType: 'text' });
  }

  listarPersonas(): Observable<Persona[]> {
    return this.http.get<Persona[]>(`${this.apiUrl}/listar-personas`);
  }
}