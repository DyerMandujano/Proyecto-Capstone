import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router'; // <-- Importa RouterLink

// Modelos
// import { Curso } from '../../models/curso.model'; // Omitido
import { Persona } from '../../models/persona.model';
import { LoginResponse } from '../../models/login-response.model';

// Servicios
import { AuthService } from '../../services/auth.service';
// import { CursoService } from '../../services/curso.service'; // Omitido
import { UsuarioService } from '../../services/usuario.service';

declare var bootstrap: any; 

@Component({
  selector: 'app-estudiante',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './estudiante.component.html',
  styleUrls: ['./estudiante.component.css']
})
export class EstudianteComponent implements OnInit {

  currentUser: LoginResponse | null = null;
  profileData: Persona | null = null;
  // cursosPopulares: Curso[] = []; // Omitido
  // cursosNuevos: Curso[] = []; // Omitido
  
  successMessage: string | null = null;
  errorMessage: string | null = null;

  confirmUsername: string = '';
  configModal: any; 

  constructor(
    private authService: AuthService,
    // private cursoService: CursoService, // Omitido
    private usuarioService: UsuarioService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  public get primerNombre(): string {
    if (this.currentUser && this.currentUser.nombreCompleto) {
      return this.currentUser.nombreCompleto.split(' ')[0];
    }
    return '...';
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser(); 

    if (this.currentUser) {
      this.loadProfileData(this.currentUser.idPersona);
      console.log('ID de Persona que se usará para el perfil:', this.currentUser.idPersona);
      // this.loadCursos(); // Omitido
    } else {
      this.authService.logout();
      this.router.navigate(['/login']);
    }

    if (isPlatformBrowser(this.platformId)) {
      const modalElement = document.getElementById('configModal');
      if (modalElement) {
        this.configModal = new bootstrap.Modal(modalElement);
      }
    }
  }
  
      irAMisCertificados(): void {
  const idEstudiante = Number(localStorage.getItem('idEstudiante'));

  if (!idEstudiante) {
    console.error("No existe idEstudiante en el localStorage");
    return;
  }

  this.router.navigate(['/certificados/estudiante', idEstudiante]);
}

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

  // loadCursos(): void { ... } // Método omitido

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
    this.router.navigate(['/login']);
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