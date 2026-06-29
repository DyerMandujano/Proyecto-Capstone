import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Leccion } from '../../models/leccion.model';
import { LeccionService } from '../../services/leccion.service';
import { DocenteHeaderComponent } from '../docente-header/docente-header.component';

@Component({
  selector: 'app-leccion',
  standalone: true,
  imports: [CommonModule, DocenteHeaderComponent],
  templateUrl: './leccion.component.html',
  styleUrl: './leccion.component.css'
})
export class LeccionComponent implements OnInit {

  idSeccion!: number;
  idCurso!: number;
  lecciones: Leccion[] = [];
  leccionSeleccionada!: Leccion;

  constructor(
    private route: ActivatedRoute,
    private leccionService: LeccionService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

ngOnInit(): void {
    this.inicializarLeccion();
    this.idSeccion = Number(this.route.snapshot.paramMap.get('id'));
    
    if (isPlatformBrowser(this.platformId)) {
      // 🔹 NUEVO: Guardamos el ID de la sección actual para que los hijos sepan a dónde volver
      localStorage.setItem('idSeccionActual', this.idSeccion.toString());
      
      const idCursoGuardado = localStorage.getItem('idCursoActual');
      if (idCursoGuardado) {
        this.idCurso = +idCursoGuardado;
      }
    }

    this.cargarLecciones();
  }

  cargarLecciones(): void {
    if (this.idSeccion) {
      this.leccionService.listarLeccionesPorSeccion(this.idSeccion)
        .subscribe({
          next: (data: Leccion[]) => this.lecciones = data,
          error: (err: any) => console.error('Error al cargar lecciones', err)
        });
    }
  }

  inicializarLeccion(): void {
    this.leccionSeleccionada = {
      idLeccion: 0,
      idSeccion: 0,
      nombreLeccion: '',
      duracion: 0,
      ordenLeccion: 0,
      estado: 1,
      urlVideo: '',
      materiales: [] 
    };
  }

  navegarRegistrarLeccion(): void {
    this.router.navigate([`/seccion/${this.idSeccion}/registrar-leccion`]);
  }

  navegarActualizarLeccion(idLeccion: number): void {
    this.router.navigate(['/actualizar-leccion', idLeccion]);
  }

  volverASecciones(): void {
    if (this.idCurso) {
      this.router.navigate([`/seccion/curso/${this.idCurso}`]);
    } else {
      console.error('No se encontró el idCurso');
      this.router.navigate(['/panel-docente']); 
    }
  }

  eliminarLeccion(idLeccion: number): void {
    if (confirm('¿Estás seguro de eliminar esta Leccion?')) {
      this.leccionService.eliminarLeccion(idLeccion).subscribe({
        next: (respuesta: any) => {
          this.cargarLecciones();
        },
        error: (err: any) => {
          console.error('Error al eliminar leccion:', err);
          alert('❌ No se pudo eliminar la leccion');
        }
      });
    }
  }
}