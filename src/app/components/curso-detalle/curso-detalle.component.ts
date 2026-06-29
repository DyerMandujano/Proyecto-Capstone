import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CursoService } from '../../services/curso.service';
import { SeccionService } from '../../services/seccion.service';
import { LeccionService } from '../../services/leccion.service';
import { Curso } from '../../models/curso.model';
import { Seccion } from '../../models/seccion.model';
import { Leccion } from '../../models/leccion.model';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';

// 🔹 NUEVAS IMPORTACIONES PARA INCRUSTAR DOCUMENTOS DE FORMA SEGURA
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-curso-detalle',
  standalone: true,
  imports: [CommonModule, SafeUrlPipe],
  templateUrl: './curso-detalle.component.html',
  styleUrls: ['./curso-detalle.component.css'],
})
export class CursoDetalleComponent implements OnInit {
  curso: Curso | null = null;
  secciones: Seccion[] = [];
  leccionesPorSeccion: { [key: number]: Leccion[] } = {};
  currentLesson: Leccion | null = null;
  currentSeccion: Seccion | null = null;
  cursoId!: number;
  cargando: boolean = true;
  error: string = '';
  isBrowser: boolean; 
  
  // Estado para acordeones y progreso
  expandedSections: { [key: number]: boolean } = {};
  expandedResources: { [key: number]: boolean } = {};
  completedLessons: Set<number> = new Set();

  // 🔹 VARIABLES PARA EL INTERRUPTOR DE VISTA (Video vs Material)
  vistaActiva: 'video' | 'material' = 'video';
  materialSeleccionadoUrl: SafeResourceUrl | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cursoService: CursoService,
    private seccionService: SeccionService,
    private leccionService: LeccionService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private sanitizer: DomSanitizer // 🔹 INYECTAMOS EL SANITIZER
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId); 
  }

  ngOnInit() {
    this.cursoId = +this.route.snapshot.paramMap.get('id')!;
    
    if (this.isBrowser && this.cursoId) {
      localStorage.setItem('cursoId', this.cursoId.toString());
      console.log('💾 Curso ID guardado en localStorage:', this.cursoId);
    }

    this.cargarCurso();
  }

  cargarCurso() {
    this.cargando = true;
    this.cursoService.obtenerCursoPorId(this.cursoId).subscribe({
      next: (curso) => {
        this.curso = curso;
        this.cargarSecciones();
      },
      error: (error) => {
        console.error('Error cargando curso:', error);
        this.error = 'Error al cargar el curso';
        this.cargando = false;
      }
    });
  }

  regresarCursos(): void {
    if (!this.isBrowser) return;

    const idEstudianteLS = localStorage.getItem('idEstudiante');

    if (!idEstudianteLS) {
      console.error("❌ No se encontró idEstudiante en el localStorage");
      return;
    }

    const idEstudiante = +idEstudianteLS;
    localStorage.removeItem('cursoId');
    this.router.navigate([`/visualizar-cursos/${idEstudiante}`]);
  }

  cargarSecciones() {
    this.seccionService.listarSeccionesActivasPorCurso(this.cursoId).subscribe({
      next: (secciones) => {
        this.secciones = secciones.sort((a, b) => a.ordenSeccion - b.ordenSeccion);
        this.cargarLeccionesPorSeccion();
      },
      error: (error) => {
        console.error('Error cargando secciones:', error);
        this.cargando = false;
      }
    });
  }

  cargarLeccionesPorSeccion() {
    let seccionesCargadas = 0;
    
    if (this.secciones.length === 0) {
      this.cargando = false;
      return;
    }

    this.secciones.forEach(seccion => {
      this.leccionService.listarLeccionesPorSeccion(seccion.idSeccion).subscribe({
        next: (lecciones) => {
          this.leccionesPorSeccion[seccion.idSeccion] = lecciones.sort((a, b) => a.ordenLeccion - b.ordenLeccion);
          seccionesCargadas++;
          
          if (seccion.ordenSeccion === 1) {
            this.expandedSections[seccion.idSeccion] = true;
          }
          
          if (seccion.ordenSeccion === 1 && lecciones.length > 0 && !this.currentLesson) {
            this.seleccionarLeccion(lecciones[0], seccion);
          }
          
          if (seccionesCargadas === this.secciones.length) {
            this.cargando = false;
          }
        },
        error: (error) => {
          console.error('Error cargando lecciones:', error);
          seccionesCargadas++;
          if (seccionesCargadas === this.secciones.length) {
            this.cargando = false;
          }
        }
      });
    });
  }

  seleccionarLeccion(leccion: Leccion, seccion: Seccion): void {
    this.currentLesson = leccion;
    this.currentSeccion = seccion;
    
    // 🔹 Forzamos a que siempre vuelva a mostrar el video al cambiar de lección
    this.volverAlVideo();
    
    if (!this.completedLessons.has(leccion.idLeccion)) {
      this.completedLessons.add(leccion.idLeccion);
    }
  }

  esUltimaLeccion(): boolean {
    if (!this.currentLesson || !this.secciones || !this.leccionesPorSeccion) {
      return false;
    }

    const ultimaSeccion = this.secciones[this.secciones.length - 1];
    const leccionesUltimaSeccion = this.leccionesPorSeccion[ultimaSeccion.idSeccion];

    if (!leccionesUltimaSeccion || leccionesUltimaSeccion.length === 0) {
      return false;
    }

    const ultimaLeccion = leccionesUltimaSeccion[leccionesUltimaSeccion.length - 1];

    return this.currentLesson.idLeccion === ultimaLeccion.idLeccion;
  }

  toggleSection(sectionId: number): void {
    this.expandedSections[sectionId] = !this.expandedSections[sectionId];
  }

  toggleResources(lessonId: number): void {
    this.expandedResources[lessonId] = !this.expandedResources[lessonId];
  }

  isSectionExpanded(sectionId: number): boolean {
    return this.expandedSections[sectionId];
  }

  areResourcesExpanded(lessonId: number): boolean {
    return this.expandedResources[lessonId];
  }

  getProgressPercentage(): number {
    const totalLessons = Object.values(this.leccionesPorSeccion)
      .reduce((total, lecciones) => total + lecciones.length, 0);
    return totalLessons > 0 ? (this.completedLessons.size / totalLessons) * 100 : 0;
  }

  getProgressText(): string {
    const totalLessons = Object.values(this.leccionesPorSeccion)
      .reduce((total, lecciones) => total + lecciones.length, 0);
    return `${this.completedLessons.size} de ${totalLessons} lecciones completadas`;
  }

  siguienteLeccion(): void {
    if (this.currentLesson && this.currentSeccion) {
      const currentSeccionLecciones = this.leccionesPorSeccion[this.currentSeccion.idSeccion];
      const currentIndex = currentSeccionLecciones.findIndex(l => l.idLeccion === this.currentLesson!.idLeccion);
      
      if (currentIndex < currentSeccionLecciones.length - 1) {
        this.seleccionarLeccion(currentSeccionLecciones[currentIndex + 1], this.currentSeccion);
      } else {
        const currentSeccionIndex = this.secciones.findIndex(s => s.idSeccion === this.currentSeccion!.idSeccion);
        if (currentSeccionIndex < this.secciones.length - 1) {
          const nextSeccion = this.secciones[currentSeccionIndex + 1];
          const nextSeccionLecciones = this.leccionesPorSeccion[nextSeccion.idSeccion];
          if (nextSeccionLecciones && nextSeccionLecciones.length > 0) {
            this.seleccionarLeccion(nextSeccionLecciones[0], nextSeccion);
            this.expandedSections[nextSeccion.idSeccion] = true;
          }
        }
      }
    }
  }

  anteriorLeccion(): void {
    if (this.currentLesson && this.currentSeccion) {
      const currentSeccionLecciones = this.leccionesPorSeccion[this.currentSeccion.idSeccion];
      const currentIndex = currentSeccionLecciones.findIndex(l => l.idLeccion === this.currentLesson!.idLeccion);
      
      if (currentIndex > 0) {
        this.seleccionarLeccion(currentSeccionLecciones[currentIndex - 1], this.currentSeccion);
      } else {
        const currentSeccionIndex = this.secciones.findIndex(s => s.idSeccion === this.currentSeccion!.idSeccion);
        if (currentSeccionIndex > 0) {
          const prevSeccion = this.secciones[currentSeccionIndex - 1];
          const prevSeccionLecciones = this.leccionesPorSeccion[prevSeccion.idSeccion];
          if (prevSeccionLecciones && prevSeccionLecciones.length > 0) {
            this.seleccionarLeccion(prevSeccionLecciones[prevSeccionLecciones.length - 1], prevSeccion);
            this.expandedSections[prevSeccion.idSeccion] = true;
          }
        }
      }
    }
  }

  getLeccionesBySeccion(seccionId: number): Leccion[] {
    return this.leccionesPorSeccion[seccionId] || [];
  }

  isLessonCompleted(lessonId: number): boolean {
    return this.completedLessons.has(lessonId);
  }

  marcarComoCompletada(): void {
    if (this.currentLesson) {
      this.completedLessons.add(this.currentLesson.idLeccion);
    }
  }

  getVideoUrl(leccionId: number): string {
    const videoMap: { [key: number]: string } = {
      1: 'https://www.sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      2: 'https://www.sample-videos.com/video123/mp4/480/big_buck_bunny_480p_1mb.mp4',
      3: 'https://www.sample-videos.com/video123/mp4/360/big_buck_bunny_360p_1mb.mp4',
    };
    
    return videoMap[leccionId] || 'https://www.sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4';
  }

  irAEvaluacion(): void {
    if (!this.currentSeccion) {
      console.error("❌ No hay sección actual seleccionada.");
      return;
    }

    const idSeccion = this.currentSeccion.idSeccion;
    this.router.navigate(['/evaluacion/seccion', idSeccion]);
  }

// 🔹 MÉTODOS NUEVOS PARA MANEJAR EL VISOR DE DOCUMENTOS
  verMaterialEnPantalla(urlRuta: string | undefined): void {
    if (!urlRuta) return; // Si el material no tiene URL, ignoramos el clic
    
    const urlCompleta = 'http://localhost:8888/' + urlRuta;
    this.materialSeleccionadoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(urlCompleta);
    this.vistaActiva = 'material'; 
  }

  volverAlVideo(): void {
    this.vistaActiva = 'video';
    this.materialSeleccionadoUrl = null;
  }
}