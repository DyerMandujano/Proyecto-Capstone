import { Component, OnInit } from '@angular/core';
import { Leccion } from '../../models/leccion.model';
import { ActivatedRoute, Router } from '@angular/router';
import { LeccionService } from '../../services/leccion.service';
import { CommonModule } from '@angular/common';
import { DocenteHeaderComponent } from '../docente-header/docente-header.component';

@Component({
  selector: 'app-leccion',
  imports: [CommonModule,DocenteHeaderComponent],
  templateUrl: './leccion.component.html',
  styleUrl: './leccion.component.css'
})
export class LeccionComponent implements OnInit{

  idSeccion!: number;
  idCurso!: number;


  lecciones: Leccion[] = [];

  constructor(private route: ActivatedRoute,
              private leccionService: LeccionService,
              private router: Router
  ) {}

  ngOnInit(): void {
    this.idSeccion = Number(this.route.snapshot.paramMap.get('id'));
    console.log('ID seccion recibido:', this.idSeccion);    
    
     const idCursoGuardado = localStorage.getItem('idCursoActual');
    if (idCursoGuardado) {
      this.idCurso = +idCursoGuardado;
    }

    this.leccionService.listarLeccionesPorSeccion(this.idSeccion)
    .subscribe(data => (this.lecciones = data));
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
    }
  }

  eliminarLeccion(idLeccion: number): void {
  if (confirm('¿Estás seguro de eliminar esta Leccion?')) {
    this.leccionService.eliminarLeccion(idLeccion).subscribe({
      next: (respuesta) => {
       
        // Volvemos a cargar la lista actualizada
        this.leccionService.listarLeccionesPorSeccion(this.idSeccion)
            .subscribe(data => this.lecciones = data);
      },
      error: (err) => {
        console.error('Error al eliminar leccion:', err);
        alert('❌ No se pudo eliminar leccion');
      }
    });
  }
}

}
