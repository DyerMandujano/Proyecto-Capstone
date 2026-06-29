import { Component, OnInit } from '@angular/core';
import { Leccion } from '../../../models/leccion.model';
import { ActivatedRoute, Router } from '@angular/router';
import { LeccionService } from '../../../services/leccion.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocenteHeaderComponent } from '../../docente-header/docente-header.component';

@Component({
  selector: 'app-registrar-leccion',
  imports: [CommonModule,FormsModule,DocenteHeaderComponent],
  templateUrl: './registrar-leccion.component.html',
  styleUrl: './registrar-leccion.component.css'
})
export class RegistrarLeccionComponent implements OnInit {

  idSeccion!:number;

  nuevaLeccion: Leccion = {
    idLeccion:0,
    idSeccion:0,
    nombreLeccion:'',
    duracion:0,
    ordenLeccion:0,
    estado:1,
    urlVideo: '',
    materiales: []
  }

    constructor(private route: ActivatedRoute,
    private leccionService: LeccionService,
    private router: Router) {}


    ngOnInit(): void {
    // Obtener el id seccion desde la URL
    this.idSeccion = Number(this.route.snapshot.paramMap.get('id'));
    this.nuevaLeccion.idSeccion = this.idSeccion;
    console.log('📘 Id seccion recibido:', this.idSeccion);
  }

registrarSeccion() {

    this.leccionService.insertarLeccion(this.nuevaLeccion).subscribe({
      next: (mensaje) => {
        alert('✅ ' + mensaje);
        console.log('leccion insertada:', this.nuevaLeccion);

        // 🔁 Opcional: Redirigir al panel de seccion después de guardar
        this.router.navigate(['leccion/seccion', this.idSeccion]);
      },
      error: (err) => {
        console.error('Error al insertar leccion:', err);
        alert('❌ Error al registrar el leccion.');
      }
    });
  }

  // 🔹 Agrega estos dos métodos dentro de la clase:
  agregarMaterial() {
    this.nuevaLeccion.materiales.push({ urlMaterial: '', nombreArchivo: '' });
  }

  quitarMaterial(index: number) {
    this.nuevaLeccion.materiales.splice(index, 1);
  }
}
