import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

// Modelos
import { CursoMatricula } from '../../../models/CursoMatricula';
import { CursoNoMatricula } from '../../../models/CursoNoMatricula';
import { Persona } from '../../../models/persona.model';
import { LoginResponse } from '../../../models/login-response.model';

// Servicios
import { EstudianteService } from '../../../services/estudiante.service';
import { AuthService } from '../../../services/auth.service';
import { UsuarioService } from '../../../services/usuario.service';
import { CursoService } from '../../../services/curso.service'; // <--- ¡¡AQUÍ ESTÁ LA CLAVE!!

declare var bootstrap: any;

@Component({
  selector: 'app-visualizar-cursos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink], 
  templateUrl: './visualizar-cursos.component.html',
  styleUrl: './visualizar-cursos.component.css'
})
export class VisualizarCursosComponent implements OnInit {

  // Propiedades para los cursos
  idEstudiante!: number;
  cursos: CursoMatricula[] = []; // Cursos Matriculados
  cursosNoM: CursoNoMatricula[] = []; // Cursos No Matriculados

  // Propiedades para el Perfil y Modal
  currentUser: LoginResponse | null = null;
  profileData: Persona | null = null;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  confirmUsername: string = '';
  configModal: any; 

  constructor(
    private route: ActivatedRoute,
    private estudianteService: EstudianteService,
    private router: Router,
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private cursoService: CursoService, // <--- ¡¡INYECTA EL SERVICIO DE CURSO!!
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  public get primerNombre(): string {
    if (this.currentUser && this.currentUser.nombreCompleto) {
      return this.currentUser.nombreCompleto.split(' ')[0];
    }
    return '...';
    
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    if (!this.currentUser) {
      this.authService.logout();
      this.router.navigate(['/login']);
      return;
    }

    // Carga los datos del perfil (para el modal)
    this.loadProfileData(this.currentUser.idPersona);

    // Carga los cursos (usando el ID de la URL)
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.idEstudiante = +id;
        
        //GUARDADO EN EL LOCALSTORAGE
        localStorage.setItem('idEstudiante', this.idEstudiante.toString());
        // Carga los cursos en los que SÍ está matriculado
        this.obtenerCursosPorEstudiante(this.idEstudiante);
        
        // Carga los cursos en los que NO está matriculado
        this.obtenerCursosSinMatricula(this.idEstudiante);
      }
    });

    // Prepara el modal de Bootstrap
    if (isPlatformBrowser(this.platformId)) {
      const modalElement = document.getElementById('configModal');
      if (modalElement) {
        this.configModal = new bootstrap.Modal(modalElement);
      }
    }
  }

  // Este método usa EstudianteService (¡Correcto!)
  obtenerCursosPorEstudiante(id: number): void {
    this.estudianteService.obtenerCursosMatricula(id).subscribe({
      next: (data) => {
        this.cursos = data;
      },
      error: (err) => {
        console.error('Error al obtener los cursos del estudiante:', err);
      }
    });
  }

  obtenerCursosSinMatricula(id: number): void {
    this.cursoService.listarCursosSinMatriculaporEstu(id).subscribe({
      next: (data) => {
        this.cursosNoM = data;
        console.log('Cursos del estudiante:', data);
      },
      error: (err) => {
        console.error('Error al obtener los cursos del estudiante:', err);
      }
    });
  }


    irAMisCertificados(): void {
  const idEstudiante = Number(localStorage.getItem('idEstudiante'));

  if (!idEstudiante) {
    console.error("No existe idEstudiante en el localStorage");
    return;
  }

  this.router.navigate(['/certificados/estudiante', idEstudiante]);
}

  // --- Métodos para el Perfil (traídos de estudiante.component.ts) ---

  loadProfileData(idPersona: number): void {
    this.usuarioService.obtenerPerfil(idPersona).subscribe(
      (data: Persona) => { 
        this.profileData = data;
        if (this.profileData && this.profileData.fechaDeNacimiento) {
          this.profileData.fechaDeNacimiento = new Date(this.profileData.fechaDeNacimiento).toISOString().split('T')[0];
        }
      },
      (err: any) => { 
        this.errorMessage = 'Error al cargar los datos de tu perfil.';
      }
    );
  }

  onUpdateProfile(): void {
    if (!this.profileData) return;

    this.usuarioService.actualizarPerfil(this.profileData.idPersona, this.profileData).subscribe(
      (response: string) => { 
        this.successMessage = response; 
        this.errorMessage = null;
        if (this.configModal) {
          this.configModal.hide(); 
        }
        if(this.currentUser) {
            this.currentUser.nombreCompleto = `${this.profileData?.nombres} ${this.profileData?.apellidos}`;
            this.authService.saveSession(this.currentUser); 
        }
      },
      (err: any) => { 
        this.errorMessage = err.error?.message || 'Error al actualizar el perfil.';
        this.successMessage = null;
      }
    );
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/']); // Redirige a la Home al salir
  }
  
  onDeleteAccount(): void {
      if (this.confirmUsername !== this.currentUser?.username) {
          this.errorMessage = "El nombre de usuario no coincide.";
          return;
      }
      console.log("Enviando solicitud para eliminar cuenta...");
      alert('Funcionalidad de eliminar cuenta aún no conectada al backend.');
  }
}
