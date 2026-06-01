import { Component, OnInit } from '@angular/core';
import { Seccion } from '../../../models/seccion.model';
import { ActivatedRoute, Router } from '@angular/router';
import { SeccionService } from '../../../services/seccion.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocenteHeaderComponent } from '../../docente-header/docente-header.component';

@Component({
  selector: 'app-registrar-seccion',
  imports: [CommonModule,FormsModule,DocenteHeaderComponent],
  templateUrl: './registrar-seccion.component.html',
  styleUrl: './registrar-seccion.component.css'
})
export class RegistrarSeccionComponent implements OnInit {

  idCurso!:number;
  nuevaSeccion: Seccion = {
  idSeccion:0,
  idCurso:0,
  nombreSeccion:'',
  ordenSeccion:0,
  estado:1
  };

  constructor(private route: ActivatedRoute,
    private seccionService: SeccionService,
    private router: Router) {}


    ngOnInit(): void {
    // Obtener el id del curso desde la URL
    this.idCurso = Number(this.route.snapshot.paramMap.get('id'));
    this.nuevaSeccion.idCurso = this.idCurso;
    console.log('📘 Id curso recibido:', this.idCurso);
  }

registrarSeccion() {

    this.seccionService.insertarSeccion(this.nuevaSeccion).subscribe({
      next: (mensaje) => {
        alert('✅ ' + mensaje);
        console.log('seccion insertada:', this.nuevaSeccion);

        // 🔁 Opcional: Redirigir al panel de seccion después de guardar
        this.router.navigate(['/seccion/curso', this.idCurso]);
      },
      error: (err) => {
        console.error('Error al insertar seccion:', err);
        alert('❌ Error al registrar el seccion.');
      }
    });
  }


}
