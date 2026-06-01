import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { jsPDF } from 'jspdf';

// --- Modelos ---
import { EvaluacionCurso } from '../../models/evaluacionCurso';
import { Evaluacion } from '../../models/evaluacion';
import { Certificado } from '../../models/certificado.model';

// --- Servicios ---
import { EvaluacionCursoService } from '../../services/evaluacion-curso.service';
import { CertificadoService } from '../../services/certificado.service';
import { AuthService } from '../../services/auth.service';
import { CursoService } from '../../services/curso.service'; // <--- IMPORTANTE

@Component({
  selector: 'app-evaluacion-curso',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './evaluacion-curso.component.html',
  styleUrl: './evaluacion-curso.component.css'
})
export class EvaluacionCursoComponent implements OnInit {

  evaluaciones: EvaluacionCurso[] = [];
  evaluacion: Evaluacion[] = [];
  idSeccion!: number;

  // Datos para el certificado
  idEstudiante!: number;
  idCurso!: number;
  
  // VARIABLE CLAVE: Aquí guardaremos "Albañilería Básica"
  nombreCurso: string = '';

  constructor(
    private evaluacionService: EvaluacionCursoService,
    private certificadoService: CertificadoService,
    private authService: AuthService,
    private cursoService: CursoService, // <--- Inyectamos el servicio
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    console.log('--- ngOnInit EvaluacionCursoComponent ---');
    
    // 1. Obtener ID de la sección (URL)
    this.idSeccion = Number(this.route.snapshot.paramMap.get('id'));

    // 2. Obtener datos del estudiante logueado
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.rol === 'estudiante') {
      this.idEstudiante = currentUser.idRolEspecifico || 0;
    } else {
      console.warn('⚠️ No se encontró un usuario estudiante logueado.');
    }

    // 3. RECUPERAR ID CURSO Y BUSCAR SU NOMBRE REAL ("Albañilería Básica")
    const storedCursoId = localStorage.getItem('cursoId');
    
    if (storedCursoId) {
      this.idCurso = Number(storedCursoId);
      console.log('📘 ID Curso recuperado:', this.idCurso);

      // LLAMADA AL SERVICIO DE CURSOS
      this.cursoService.obtenerCursoPorId(this.idCurso).subscribe({
        next: (curso: any) => {
          // Buscamos el nombre en las propiedades comunes
          this.nombreCurso = curso.nombre || curso.titulo || curso.nombreCurso || "Curso SkillUp";
          console.log('✅ NOMBRE DEL CURSO CARGADO:', this.nombreCurso);
        },
        error: (err: any) => {
          console.error('❌ Error obteniendo curso:', err);
          this.nombreCurso = "Curso de Especialización"; // Texto por defecto si falla
        }
      });
    } else {
      console.warn('⚠️ No se encontró "cursoId" en localStorage.');
    }

    // 4. Cargar datos del EXAMEN (Preguntas y Título del examen)
    if (this.idSeccion) {
      // Título del examen (ej. "Evaluación Final")
      this.evaluacionService.listarTituloEvaluacion(this.idSeccion).subscribe({
        next: (data: any) => {
            this.evaluacion = data;
            // NOTA: Ya NO sobreescribimos 'nombreCurso' aquí, para evitar que salga "Evaluación Final"
        },
        error: (err: any) => console.error('❌ Error cargando título evaluación:', err)
      });

      // Preguntas
      this.evaluacionService.listarEvaluacion(this.idSeccion).subscribe({
        next: (data: any) => {
            this.evaluaciones = data;
        },
        error: (err: any) => console.error('❌ Error cargando preguntas:', err)
      });
    }
  }

  // --- OBTENER CERTIFICADO (Lógica principal) ---
  obtenerCertificado(): void {
    console.log('--- Iniciando descarga de certificado ---');
    
    if (!this.idEstudiante || !this.idCurso) {
      alert('Error: No se identificó al estudiante o el curso.');
      return;
    }

    // 1. Guardar/Generar en Backend
    this.certificadoService.generarCertificado(this.idEstudiante, this.idCurso).subscribe({
      next: (cert: Certificado) => {
        if (!cert) {
            alert('Error: El servidor no devolvió el certificado.');
            return;
        }
        // 2. Crear el PDF visual
        this.generarPDF(cert);
      },
      error: (err: any) => {
        console.error('❌ Error en petición certificado:', err);
        alert('Hubo un error al generar el certificado en el servidor.');
      }
    });
  }

  // --- GENERAR PDF CON JSPDF ---
  generarPDF(datos: Certificado) {
    console.log('📄 Creando PDF para:', this.nombreCurso);
    
    const doc = new jsPDF('l', 'mm', 'a4');
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    // 1. Imagen de Fondo
    const imgFondo = '/img/certificado/certificado.png'; 
    try {
        doc.addImage(imgFondo, 'JPEG', 0, 0, width, height); 
    } catch (e) {
        console.warn("⚠️ No se pudo cargar la imagen de fondo", e);
    }

    // 2. Texto Estático Superior
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100); 
    doc.text("Este documento certifica que:", width / 2, 85, { align: 'center' });

    // 3. NOMBRE DEL ESTUDIANTE
    doc.setFont('times', 'bolditalic');
    doc.setFontSize(42);
    doc.setTextColor(10, 25, 47); // Azul oscuro
    const nombreCompleto = this.authService.getCurrentUser()?.nombreCompleto || "Estudiante SkillUp";
    doc.text(nombreCompleto, width / 2, 105, { align: 'center' });

    // 4. Mensaje "Por completar..."
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    // Usamos el mensaje del backend o uno por defecto
    doc.text(datos.mensaje || "Por haber aprobado satisfactoriamente el curso de:", width / 2, 120, { align: 'center' });

    // 5. NOMBRE DEL CURSO (Aquí va "Albañilería Básica")
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(212, 175, 55); // Dorado
    
    // Usamos la variable que llenamos con el servicio de Cursos
    const cursoParaMostrar = this.nombreCurso || "Curso de Especialización";
    doc.text(cursoParaMostrar, width / 2, 135, { align: 'center' });

    // 6. Fecha de Emisión
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text(`Fecha de emisión: ${datos.fechaEmision}`, width / 2, 155, { align: 'center' });

    // 7. Código ID (esquina inferior derecha)
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`ID: ${datos.codigoCertificado}`, width - 20, height - 10, { align: 'right' });

    // Descargar
    doc.save(`Certificado_SkillUp_${datos.codigoCertificado}.pdf`);
  }
}