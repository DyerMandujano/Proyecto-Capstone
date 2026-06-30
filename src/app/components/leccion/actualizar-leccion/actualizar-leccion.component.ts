import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Leccion } from '../../../models/leccion.model';
import { LeccionService } from '../../../services/leccion.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DocenteHeaderComponent } from '../../docente-header/docente-header.component';
import { SafeUrlPipe } from '../../../pipes/safe-url.pipe';

@Component({
  selector: 'app-actualizar-leccion',
  standalone: true,
  imports: [CommonModule, FormsModule, DocenteHeaderComponent, SafeUrlPipe],
  templateUrl: './actualizar-leccion.component.html',
  styleUrl: './actualizar-leccion.component.css'
})
export class ActualizarLeccionComponent implements OnInit {
  
  leccion: Leccion = {
    idLeccion: 0,
    idSeccion: 0,
    nombreLeccion: '',
    duracion: 0,
    ordenLeccion: 0,
    estado: 1,
    urlVideo: '',
    materiales: []
  };

  constructor(
    private leccionService: LeccionService, 
    private route: ActivatedRoute,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.leccionService.obtenerLeccionPorId(Number(id)).subscribe({
        next: (data: Leccion) => {
          if (data) {
            this.leccion = data;
            if (!this.leccion.materiales) {
              this.leccion.materiales = [];
            }
          }
        },
        error: (err: any) => console.error('Error al cargar la lección:', err)
      });
    } else {
      console.warn("No se encontró el ID en la URL.");
    }
  }

  seleccionarArchivo(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      if (this.leccion.materiales) {
        this.leccion.materiales[index].archivoFisico = file;
        
        if (!this.leccion.materiales[index].nombreArchivo) {
          this.leccion.materiales[index].nombreArchivo = file.name;
        }
      }
    }
  }

  actualizarSeccion(): void {
    this.leccionService.actualizarLeccion(this.leccion.idLeccion, this.leccion).subscribe({
      next: (res: any) => {
        alert('✅ Lección y materiales actualizados correctamente');
        this.regresarALista(); 
      },
      error: (err: any) => {
        console.error('Error al actualizar:', err);
        alert('❌ Ocurrió un error al actualizar la lección');
      }
    });
  }

  cancelar(): void {
    this.regresarALista();
  }

  private regresarALista(): void {
    if (isPlatformBrowser(this.platformId)) {
      const idSeccionGuardado = localStorage.getItem('idSeccionActual');
      if (idSeccionGuardado && idSeccionGuardado !== '0') {
        this.router.navigate([`/leccion/seccion/${idSeccionGuardado}`]);
        return;
      }
    }
    this.router.navigate(['/']);
  }

  agregarMaterial(): void {
    if (!this.leccion.materiales) {
      this.leccion.materiales = [];
    }
    this.leccion.materiales.push({ urlMaterial: '', nombreArchivo: '' });
  }

  quitarMaterial(index: number): void {
    if (this.leccion.materiales) {
      this.leccion.materiales.splice(index, 1);
    }
  }
}