import { Component, OnInit } from '@angular/core';
import { Leccion } from '../../../models/leccion.model';
import { ActivatedRoute, Router } from '@angular/router';
import { LeccionService } from '../../../services/leccion.service';
import { CommonModule, Location } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { DocenteHeaderComponent } from '../../docente-header/docente-header.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SafeUrlPipe } from '../../../pipes/safe-url.pipe';

@Component({
  selector: 'app-registrar-leccion',
  standalone: true,
  imports: [CommonModule, FormsModule, DocenteHeaderComponent],
  templateUrl: './registrar-leccion.component.html',
  styleUrl: './registrar-leccion.component.css'
})
export class RegistrarLeccionComponent implements OnInit {

  idSeccion!: number;
  videoUrlSegura: SafeResourceUrl | null = null;

  nuevaLeccion: Leccion = {
    idLeccion: 0,
    idSeccion: 0,
    nombreLeccion: '',
    duracion: 0,
    ordenLeccion: 0,
    estado: 1,
    urlVideo: '',
    materiales: []
  }

  constructor(
    private route: ActivatedRoute,
    private leccionService: LeccionService,
    private router: Router,
    private sanitizer: DomSanitizer,
    private location: Location 
  ) {}

  ngOnInit(): void {
    this.idSeccion = Number(this.route.snapshot.paramMap.get('id'));
    this.nuevaLeccion.idSeccion = this.idSeccion;
  }

  agregarMaterial() {
    this.nuevaLeccion.materiales.push({ urlMaterial: '', nombreArchivo: '' });
  }

  quitarMaterial(index: number) {
    this.nuevaLeccion.materiales.splice(index, 1);
  }

  // 🔹 CLAVE: Guardamos el archivo físico directamente en el arreglo del material
  onFileSelected(event: any, index: number) {
    const file: File = event.target.files[0];
    if (file) {
      this.nuevaLeccion.materiales[index].archivoFisico = file;
      
      // Autocompleta el nombre del input con el nombre del archivo si está vacío
      if (!this.nuevaLeccion.materiales[index].nombreArchivo) {
        this.nuevaLeccion.materiales[index].nombreArchivo = file.name;
      }
    }
  }

  registrarSeccion() {
    this.leccionService.insertarLeccion(this.nuevaLeccion).subscribe({
      next: (mensaje) => {
        alert('✅ Lección creada correctamente');
        // Redirige al panel correcto
        const idSeccionGuardado = localStorage.getItem('idSeccionActual') || this.idSeccion;
        this.router.navigate([`/leccion/seccion/${idSeccionGuardado}`]);
      },
      error: (err) => {
        console.error('Error al insertar leccion:', err);
        alert('❌ Error al registrar la lección.');
      }
    });
  }

  cancelar() {
    this.location.back();
  }

  actualizarVistaPreviaVideo() {
    if (!this.nuevaLeccion.urlVideo) {
      this.videoUrlSegura = null;
      return;
    }

    const videoId = this.extraerVideoId(this.nuevaLeccion.urlVideo);
    
    if (videoId) {
      const urlEmbed = `https://www.youtube.com/embed/${videoId}`;
      this.videoUrlSegura = this.sanitizer.bypassSecurityTrustResourceUrl(urlEmbed);
    } else {
      this.videoUrlSegura = null; 
    }
  }

  extraerVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }
}