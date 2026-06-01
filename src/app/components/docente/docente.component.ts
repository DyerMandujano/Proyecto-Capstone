import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CursoService } from '../../services/curso.service';
import { Curso } from '../../models/curso.model';
import { ActivatedRoute, Router } from '@angular/router';

// 1. --- IMPORTACIONES ADICIONALES ---
import { AuthService } from '../../services/auth.service';
import { UsuarioService } from '../../services/usuario.service';
import { LoginResponse } from '../../models/login-response.model';
import { Persona } from '../../models/persona.model';
import { FormsModule } from '@angular/forms'; // Asegúrate de importar FormsModule
import { ExportExcelService } from '../../services/export-excel.service';
import { CertificadoCursoService } from '../../services/certificado-curso.service';
import { CertificadoDocente } from '../../models/certificadoDocente';
import { DocenteSessionService } from '../../services/docente-session.service';


// 2. --- ACTUALIZAR METADATOS DEL COMPONENTE ---
@Component({
  selector: 'app-docente',
  standalone: true,
  imports: [CommonModule, FormsModule], // Añadir FormsModule
  templateUrl: './docente.component.html',
  styleUrl: './docente.component.css'
})
export class DocenteComponent implements OnInit { 
    
    idDocente!: number;
    cursos: Curso[] = [];
    nombreDelDocente: string = '';
    certificados: CertificadoDocente[] = [];

    // 3. --- PROPIEDADES NUEVAS (COPIADAS DE ESTUDIANTE) ---
    currentUser: LoginResponse | null = null;
    profileData: Persona | null = null;
    successMessage: string | null = null;
    errorMessage: string | null = null;
    confirmUsername: string = ''; // Para el modal de eliminar
    configModal: any; // Para manejar el modal de Bootstrap

  constructor(
    //agregando local storage nombre docente 
    private docenteSessionService: DocenteSessionService,
    private cursoService: CursoService,
    private route: ActivatedRoute,
    private router: Router,
    // 4. --- INYECTAR NUEVOS SERVICIOS ---
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private excelService: ExportExcelService,
    private certificadoService: CertificadoCursoService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // 5. --- OBTENER DATOS DEL USUARIO LOGUEADO ---
    this.currentUser = this.authService.getCurrentUser();

    if (this.currentUser) {
      this.nombreDelDocente = this.currentUser.nombreCompleto;

       // GUARDAR EN LOCALSTORAGE
      this.docenteSessionService.setNombreDocente(this.nombreDelDocente);
      // Cargar datos del perfil para el modal
      this.loadProfileData(this.currentUser.idPersona);
    } else {
      // Si no hay sesión, no debería estar aquí
      this.authService.logout();
      this.router.navigate(['/login']);
      return;
    }
    
    // Carga el ID del docente desde la URL
    this.idDocente = Number(this.route.snapshot.paramMap.get('id'));

    // Carga los cursos
    if (this.idDocente) {
      this.cursoService.listarCursosPorDocente(this.idDocente)
          .subscribe(data => (this.cursos = data));
    }
    this.certificadoService.listarCertificadosPorDocente(this.idDocente)
      .subscribe(data => this.certificados = data);

    // 6. --- INICIALIZAR EL MODAL (COPIADO DE ESTUDIANTE) ---
    if (isPlatformBrowser(this.platformId)) {
      const modalElement = document.getElementById('configModal');
      if (modalElement) {
        // Debes tener Bootstrap JS cargado en tu index.html para que esto funcione
        // @ts-ignore
        this.configModal = new bootstrap.Modal(modalElement);
      }
    }
  }

  // 7. --- AÑADIR LOS SIGUIENTES MÉTODOS NUEVOS ---

  loadProfileData(idPersona: number): void {
    this.usuarioService.obtenerPerfil(idPersona).subscribe(
      (data: Persona) => { 
        this.profileData = data;
        // Asegurarse de que la fecha tenga el formato YYYY-MM-DD para el input date
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

        // Actualizar el nombre en la sesión actual
        if(this.currentUser) {
            this.currentUser.nombreCompleto = `${this.profileData?.nombres} ${this.profileData?.apellidos}`;
            this.authService.saveSession(this.currentUser); 
            // Actualizar el nombre mostrado en el header
            this.nombreDelDocente = this.currentUser.nombreCompleto;

            // ACTUALIZAR LOCALSTORAGE
            localStorage.setItem('nombreDelDocente', this.nombreDelDocente);
        }
      },
      (err: any) => { 
        this.errorMessage = err.error?.message || 'Error al actualizar el perfil.';
        this.successMessage = null;
      }
    );
  }

  onLogout(): void {
    
    localStorage.removeItem('nombreDelDocente');
    this.authService.logout();
    this.router.navigate(['/']); // Redirige a la Home al salir
  }
  
  onDeleteAccount(): void {
      if (this.confirmUsername !== this.currentUser?.username) {
          this.errorMessage = "El nombre de usuario no coincide.";
          return;
      }
      console.log("Enviando solicitud para eliminar cuenta...");
      // Aquí iría la lógica para llamar al servicio de eliminación
      alert('Funcionalidad de eliminar cuenta aún no conectada al backend.');
  }

  // --- TUS MÉTODOS ANTIGUOS (SIN CAMBIOS) ---

  navegarRegistrarCurso(): void {
    this.router.navigate([`/docente/${this.idDocente}/registrar-curso`]);
  }

  navegarActualizarCurso(idCurso: number): void {
    this.router.navigate(['/actualizar-curso', idCurso]);
  }

  navegarSeccion(idCurso: number) {
    localStorage.setItem('idDocente', this.idDocente.toString());
    this.router.navigate(['/seccion/curso', idCurso]);
  }
  
  exportarExcel() {
    this.excelService.exportAsExcelFile(this.certificados, 'Certificados_Docente');
  }

  eliminarCurso(idCurso: number): void {
    if (confirm('¿Estás seguro de eliminar este curso?')) {
      this.cursoService.eliminarCurso(idCurso).subscribe({
        next: (respuesta) => {
          alert('✅ Curso eliminado correctamente');
          this.cursoService.listarCursosPorDocente(this.idDocente)
              .subscribe(data => this.cursos = data);
        },
        error: (err) => {
          console.error('Error al eliminar el curso:', err);
          alert('❌ No se pudo eliminar el curso');
        }
      });
    }
  }
}