import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
import { LoginRequest } from '../models/login-request.model';
import { LoginResponse } from '../models/login-response.model';
import { RegistroRequest } from '../models/registro-request.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private BASE_URL = 'http://localhost:8888/api/auth';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  // --- MÉTODOS DE API ---
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.BASE_URL}/login`, credentials);
  }

  register(userData: RegistroRequest): Observable<any> {
    return this.http.post(`${this.BASE_URL}/registrar`, userData, { responseType: 'text' });
  }

  // --- SESIÓN SEGURO PARA SSR ---
  saveSession(response: LoginResponse): void {
    if (!isPlatformBrowser(this.platformId)) return;

    localStorage.setItem('token', response.token);

    const userData = {
      idUsuario: response.idUsuario,
      username: response.username,
      nombreCompleto: response.nombreCompleto,
      rol: response.rol,
      idRolEspecifico: response.idRolEspecifico,
      idPersona: response.idPersona
    };

    localStorage.setItem('currentUser', JSON.stringify(userData));
  }

  getCurrentUser(): LoginResponse | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  logout(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;

    return !!localStorage.getItem('token') &&
           !!localStorage.getItem('currentUser');
  }
}
