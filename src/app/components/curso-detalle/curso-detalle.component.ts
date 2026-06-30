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

// 🔹 NUEVO: Importamos FormsModule para leer los inputs (ngModel)
import { FormsModule } from '@angular/forms'; 
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-curso-detalle',
  standalone: true,
  // 🔹 NUEVO: Añadimos FormsModule a los imports
  imports: [CommonModule, SafeUrlPipe, FormsModule], 
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

  vistaActiva: 'video' | 'material' = 'video';
  materialSeleccionadoUrl: SafeResourceUrl | null = null;
  materialSeleccionadoRawUrl: string | null = null; 
  esPdf: boolean = false;
  pestanaActiva: string = 'descripcion';

  // 🔹 NUEVO: Variables para controlar los inputs y el historial del foro/notas
  nuevaPregunta: string = '';
  nuevaNota: string = '';
  
  // Listas temporales para mostrar los datos en la vista (simulación frontend)
  preguntasForo: { autor: string, texto: string, fecha: Date }[] = [];
  misNotas: { texto: string, fecha: Date }[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cursoService: CursoService,
    private seccionService: SeccionService,
    private leccionService: LeccionService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private sanitizer: DomSanitizer 
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId); 
  }

  ngOnInit() {
    this.cursoId = +this.route.snapshot.paramMap.get('id')!;
    
    if (this.isBrowser && this.cursoId) {
      localStorage.setItem('cursoId', this.cursoId.toString());
    }

    this.cargarCurso();
  }

  cambiarPestana(pestana: string): void {
    this.pestanaActiva = pestana;
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
    if (!idEstudianteLS) return;

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
          if (seccion.ordenSeccion === 1) this.expandedSections[seccion.idSeccion] = true;
          if (seccion.ordenSeccion === 1 && lecciones.length > 0 && !this.currentLesson) {
            this.seleccionarLeccion(lecciones[0], seccion);
          }
          if (seccionesCargadas === this.secciones.length) this.cargando = false;
        },
        error: (error) => {
          seccionesCargadas++;
          if (seccionesCargadas === this.secciones.length) this.cargando = false;
        }
      });
    });
  }

  seleccionarLeccion(leccion: Leccion, seccion: Seccion): void {
    this.currentLesson = leccion;
    this.currentSeccion = seccion;
    this.volverAlVideo();
    if (!this.completedLessons.has(leccion.idLeccion)) {
      this.completedLessons.add(leccion.idLeccion);
    }
  }

  esUltimaLeccion(): boolean {
    if (!this.currentLesson || !this.secciones || !this.leccionesPorSeccion) return false;
    const ultimaSeccion = this.secciones[this.secciones.length - 1];
    const leccionesUltimaSeccion = this.leccionesPorSeccion[ultimaSeccion.idSeccion];
    if (!leccionesUltimaSeccion || leccionesUltimaSeccion.length === 0) return false;
    return this.currentLesson.idLeccion === leccionesUltimaSeccion[leccionesUltimaSeccion.length - 1].idLeccion;
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
    const totalLessons = Object.values(this.leccionesPorSeccion).reduce((total, lecciones) => total + lecciones.length, 0);
    return totalLessons > 0 ? (this.completedLessons.size / totalLessons) * 100 : 0;
  }

  getProgressText(): string {
    const totalLessons = Object.values(this.leccionesPorSeccion).reduce((total, lecciones) => total + lecciones.length, 0);
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

  irAEvaluacion(): void {
    if (!this.currentSeccion) return;
    this.router.navigate(['/evaluacion/seccion', this.currentSeccion.idSeccion]);
  }

  verMaterialEnPantalla(urlRuta: string | undefined): void {
    if (!urlRuta) {
      this.materialSeleccionadoUrl = null;
      this.materialSeleccionadoRawUrl = null; 
      this.esPdf = false;
      return;
    }
    const urlNormalizada = urlRuta.replace(/\\/g, '/');
    const urlMinuscula = urlNormalizada.toLowerCase();
    const esDocx = urlMinuscula.endsWith('.docx') || urlMinuscula.endsWith('.doc');
    this.esPdf = urlMinuscula.endsWith('.pdf');
    let urlCompleta = '';

    // ⚠️ REEMPLAZA ESTE LINK POR TU TÚNEL DE CLOUDFLARE ACTIVO ⚠️
    if (urlNormalizada.startsWith('uploads/')) {
      urlCompleta = `https://servers-argument-recognize-alphabetical.trycloudflare.com/${urlNormalizada}`;
    } else if (urlNormalizada.startsWith('http')) {
      urlCompleta = urlNormalizada;
    } else {
      urlCompleta = `https://servers-argument-recognize-alphabetical.trycloudflare.com/${urlNormalizada}`;
    }

    this.materialSeleccionadoRawUrl = urlCompleta;
    if (esDocx) {
      const msViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(urlCompleta)}`;
      this.materialSeleccionadoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(msViewerUrl);
    } else {
      this.materialSeleccionadoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(urlCompleta);
    }
    this.vistaActiva = 'material'; 
  }

  volverAlVideo(): void {
    this.vistaActiva = 'video';
    this.materialSeleccionadoUrl = null;
    this.materialSeleccionadoRawUrl = null;
    this.esPdf = false; 
  }

  descargarMaterial(): void {
    if (this.materialSeleccionadoRawUrl) {
      const url = this.materialSeleccionadoRawUrl;
      const partesUrl = url.split('/');
      const nombreArchivo = partesUrl.length > 0 ? partesUrl[partesUrl.length - 1] : 'recurso-aprendizaje';

      fetch(url)
        .then(response => {
          if (!response.ok) throw new Error('Error de red al intentar descargar el recurso');
          return response.blob();
        })
        .then(blob => {
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = nombreArchivo;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        })
        .catch(error => {
          const link = document.createElement('a');
          link.href = url;
          link.target = '_blank';
          link.download = nombreArchivo;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
    }
  }

  // 🔹 NUEVO: Funciones para interactuar con los foros y notas
  enviarPregunta(): void {
    if (this.nuevaPregunta.trim().length > 0) {
      // Guardamos la pregunta en nuestra lista local
      this.preguntasForo.unshift({
        autor: 'Tú (Estudiante)', // Esto luego vendrá del usuario logueado
        texto: this.nuevaPregunta,
        fecha: new Date()
      });
      // Limpiamos el input
      this.nuevaPregunta = '';
    }
  }

  guardarNota(): void {
    if (this.nuevaNota.trim().length > 0) {
      // Guardamos la nota
      this.misNotas.unshift({
        texto: this.nuevaNota,
        fecha: new Date()
      });
      // Limpiamos el textarea
      this.nuevaNota = '';
    }
  }
}