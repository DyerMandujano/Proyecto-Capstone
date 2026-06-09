import { Component, OnInit, Inject, PLATFORM_ID, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CursoService } from '../../services/curso.service';
import { Curso } from '../../models/curso.model';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UsuarioService } from '../../services/usuario.service';
import { LoginResponse } from '../../models/login-response.model';
import { Persona } from '../../models/persona.model';
import { FormsModule } from '@angular/forms';
import { ExportExcelService } from '../../services/export-excel.service';
import { CertificadoCursoService } from '../../services/certificado-curso.service';
import { CertificadoDocente } from '../../models/certificadoDocente';
import { DocenteSessionService } from '../../services/docente-session.service';
import { DocenteDashboardService } from '../../services/docente-dashboard.service';
import Chart from 'chart.js/auto';

// Interfaces
interface DatoCertificado {
  nombreCurso: string;
  cantidad: number;
  anio: number;
  mes: number;
}

interface DatoRanking {
  nombreCurso: string;
  totalEstudiantes: number;
}

interface DatoTendencia {
  anio: number;
  mes: number;
  cantidad: number;
}

interface DatoEstudiante {
  nombreCurso: string;
  totalEstudiantes: number;
  anio: number;
  mes: number;
}

@Component({
  selector: 'app-docente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './docente.component.html',
  styleUrl: './docente.component.css'
})
export class DocenteComponent implements OnInit, AfterViewInit {
  @ViewChild('miGrafico', { static: false }) canvasRef!: ElementRef;

  dashboardActivo: number = 1;
  chartInstance: Chart | null = null;
  datosTabla: DatoEstudiante[] = [];
  datosTablaFiltrados: DatoEstudiante[] = [];
  datosTablaAgrupados: any[] = [];
  resumenDetalle: any = {};
  cargandoDatos: boolean = false;
  fechaActual: Date = new Date();

  // Filtros
  filtroAnio: string = 'todos';
  filtroCurso: string = 'todos';
  cursosNombre: string[] = [];

  // Gráficos adicionales
  private chartEvolucion: Chart | null = null;
  private chartDistribucion: Chart | null = null;

  idDocente!: number;
  cursos: Curso[] = [];
  nombreDelDocente: string = '';
  certificados: CertificadoDocente[] = [];
  currentUser: LoginResponse | null = null;
  profileData: Persona | null = null;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  confirmUsername: string = '';
  configModal: any;

  // Datos originales
  private datosOriginales: {
    certificados: DatoCertificado[];
    ranking: DatoRanking[];
    tendenciaCert: DatoTendencia[];
    tendenciaMat: DatoTendencia[];
    estudiantes: DatoEstudiante[];
  } = {
    certificados: [],
    ranking: [],
    tendenciaCert: [],
    tendenciaMat: [],
    estudiantes: []
  };

  constructor(
    private docenteSessionService: DocenteSessionService,
    private cursoService: CursoService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private excelService: ExportExcelService,
    private certificadoService: CertificadoCursoService,
    private dashboardService: DocenteDashboardService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    if (this.currentUser) {
      this.nombreDelDocente = this.currentUser.nombreCompleto;
      this.docenteSessionService.setNombreDocente(this.nombreDelDocente);
      this.loadProfileData(this.currentUser.idPersona);
    } else {
      this.authService.logout();
      this.router.navigate(['/login']);
      return;
    }

    const idFromRoute = Number(this.route.snapshot.paramMap.get('idDocente'));
    const idFromRouteAlt = Number(this.route.snapshot.paramMap.get('id'));
    const idFromSession = this.docenteSessionService.getIdDocente();

    this.idDocente = idFromRoute || idFromRouteAlt || idFromSession || 0;

    if (this.idDocente && this.idDocente > 0) {
      this.docenteSessionService.setIdDocente(this.idDocente);
    }

    this.loadCursos();
    this.loadCertificados();

    if (isPlatformBrowser(this.platformId)) {
      const modalElement = document.getElementById('configModal');
      if (modalElement) {
        // @ts-ignore
        this.configModal = new bootstrap.Modal(modalElement);
      }
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.canvasRef && this.canvasRef.nativeElement && this.idDocente > 0) {
        this.cargarDashboard(this.dashboardActivo);
      }
    }, 500);
  }

  cambiarDashboard(numero: number): void {
    this.dashboardActivo = numero;
    if (this.idDocente && this.idDocente > 0) {
      this.cargarDashboard(numero);
    }
  }

  private destruirGrafico(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }

  private destruirGraficosAdicionales(): void {
    if (this.chartEvolucion) {
      this.chartEvolucion.destroy();
      this.chartEvolucion = null;
    }
    if (this.chartDistribucion) {
      this.chartDistribucion.destroy();
      this.chartDistribucion = null;
    }
  }

  cargarDashboard(numero: number): void {
    if (!this.idDocente || this.idDocente <= 0) {
      this.mostrarError('ID de docente no válido');
      return;
    }

    this.destruirGrafico();
    this.destruirGraficosAdicionales();

    if (!this.canvasRef?.nativeElement) {
      return;
    }

    this.cargandoDatos = true;

    // Datos de ejemplo para mostrar mientras no haya datos reales
    const datosEjemplo: any = {
      1: [
        { nombreCurso: 'Gasfitería Básica', cantidad: 25 },
        { nombreCurso: 'Electricidad Domiciliaria', cantidad: 22 },
        { nombreCurso: 'Carpintería General', cantidad: 18 },
        { nombreCurso: 'Gasfitería Avanzada', cantidad: 12 },
        { nombreCurso: 'Albañilería Estructural', cantidad: 10 }
      ],
      2: [
        { nombreCurso: 'Gasfitería Básica', totalEstudiantes: 25 },
        { nombreCurso: 'Electricidad Domiciliaria', totalEstudiantes: 22 },
        { nombreCurso: 'Carpintería General', totalEstudiantes: 18 },
        { nombreCurso: 'Gasfitería Avanzada', totalEstudiantes: 12 },
        { nombreCurso: 'Albañilería Estructural', totalEstudiantes: 10 }
      ],
      3: [
        { anio: 2024, mes: 1, cantidad: 5 },
        { anio: 2024, mes: 2, cantidad: 7 },
        { anio: 2024, mes: 3, cantidad: 10 },
        { anio: 2025, mes: 1, cantidad: 3 },
        { anio: 2025, mes: 2, cantidad: 4 },
        { anio: 2026, mes: 1, cantidad: 12 },
        { anio: 2026, mes: 2, cantidad: 15 }
      ],
      4: [
        { anio: 2024, mes: 1, cantidad: 10 },
        { anio: 2024, mes: 2, cantidad: 12 },
        { anio: 2024, mes: 3, cantidad: 15 },
        { anio: 2025, mes: 1, cantidad: 5 },
        { anio: 2025, mes: 2, cantidad: 6 },
        { anio: 2026, mes: 1, cantidad: 18 },
        { anio: 2026, mes: 2, cantidad: 20 }
      ],
      5: [
        { nombreCurso: 'Gasfitería Básica', totalEstudiantes: 25, anio: 2024, mes: 1 },
        { nombreCurso: 'Gasfitería Básica', totalEstudiantes: 30, anio: 2025, mes: 2 },
        { nombreCurso: 'Gasfitería Básica', totalEstudiantes: 40, anio: 2026, mes: 3 },
        { nombreCurso: 'Electricidad Domiciliaria', totalEstudiantes: 20, anio: 2024, mes: 1 },
        { nombreCurso: 'Electricidad Domiciliaria', totalEstudiantes: 22, anio: 2025, mes: 2 },
        { nombreCurso: 'Electricidad Domiciliaria', totalEstudiantes: 35, anio: 2026, mes: 3 },
        { nombreCurso: 'Carpintería General', totalEstudiantes: 18, anio: 2024, mes: 1 },
        { nombreCurso: 'Carpintería General', totalEstudiantes: 20, anio: 2025, mes: 2 },
        { nombreCurso: 'Carpintería General', totalEstudiantes: 28, anio: 2026, mes: 3 }
      ]
    };

    switch (numero) {
      case 1:
        this.dashboardService.getCertificadosPorCurso(this.idDocente).subscribe({
          next: (data: any[]) => {
            this.cargandoDatos = false;
            if (data && data.length > 0) {
              this.datosOriginales.certificados = data.map((item: any[]) => ({
                nombreCurso: item[0],
                cantidad: item[1],
                anio: item[2] || 2024,
                mes: item[3] || 1
              }));
              this.aplicarFiltros();
            } else {
              this.datosOriginales.certificados = datosEjemplo[1].map((item: any) => ({
                nombreCurso: item.nombreCurso,
                cantidad: item.cantidad,
                anio: 2024,
                mes: 1
              }));
              this.aplicarFiltros();
              this.mostrarError('Usando datos de ejemplo - No hay datos reales en la BD');
            }
          },
          error: (err) => {
            this.cargandoDatos = false;
            this.datosOriginales.certificados = datosEjemplo[1].map((item: any) => ({
              nombreCurso: item.nombreCurso,
              cantidad: item.cantidad,
              anio: 2024,
              mes: 1
            }));
            this.aplicarFiltros();
            this.mostrarError('Error de conexión - Usando datos de ejemplo');
          }
        });
        break;
      case 2:
        this.dashboardService.getRankingCursos(this.idDocente).subscribe({
          next: (data: any[]) => {
            this.cargandoDatos = false;
            if (data && data.length > 0) {
              this.datosOriginales.ranking = data.map((item: any[]) => ({
                nombreCurso: item[0],
                totalEstudiantes: item[1]
              }));
              this.aplicarFiltros();
            } else {
              this.datosOriginales.ranking = datosEjemplo[2];
              this.aplicarFiltros();
              this.mostrarError('Usando datos de ejemplo - No hay datos reales en la BD');
            }
          },
          error: (err) => {
            this.cargandoDatos = false;
            this.datosOriginales.ranking = datosEjemplo[2];
            this.aplicarFiltros();
            this.mostrarError('Error de conexión - Usando datos de ejemplo');
          }
        });
        break;
      case 3:
        this.dashboardService.getTendenciaCertificados(this.idDocente).subscribe({
          next: (data: any[]) => {
            this.cargandoDatos = false;
            if (data && data.length > 0) {
              this.datosOriginales.tendenciaCert = data.map((item: any[]) => ({
                anio: item[0],
                mes: item[1],
                cantidad: item[2]
              }));
              this.aplicarFiltros();
            } else {
              this.datosOriginales.tendenciaCert = datosEjemplo[3];
              this.aplicarFiltros();
              this.mostrarError('Usando datos de ejemplo - No hay datos reales en la BD');
            }
          },
          error: (err) => {
            this.cargandoDatos = false;
            this.datosOriginales.tendenciaCert = datosEjemplo[3];
            this.aplicarFiltros();
            this.mostrarError('Error de conexión - Usando datos de ejemplo');
          }
        });
        break;
      case 4:
        this.dashboardService.getTendenciaMatriculas(this.idDocente).subscribe({
          next: (data: any[]) => {
            this.cargandoDatos = false;
            if (data && data.length > 0) {
              this.datosOriginales.tendenciaMat = data.map((item: any[]) => ({
                anio: item[0],
                mes: item[1],
                cantidad: item[2]
              }));
              this.aplicarFiltros();
            } else {
              this.datosOriginales.tendenciaMat = datosEjemplo[4];
              this.aplicarFiltros();
              this.mostrarError('Usando datos de ejemplo - No hay datos reales en la BD');
            }
          },
          error: (err) => {
            this.cargandoDatos = false;
            this.datosOriginales.tendenciaMat = datosEjemplo[4];
            this.aplicarFiltros();
            this.mostrarError('Error de conexión - Usando datos de ejemplo');
          }
        });
        break;
      case 5:
        this.dashboardService.getEstudiantesPorCurso(this.idDocente).subscribe({
          next: (data: any[]) => {
            this.cargandoDatos = false;
            if (data && data.length > 0) {
              this.datosOriginales.estudiantes = data.map((item: any[]) => ({
                nombreCurso: item[0],
                totalEstudiantes: item[1],
                anio: item[2],
                mes: item[3]
              }));
              // Convertir explícitamente a string[]
              const cursosUnicos: string[] = this.datosOriginales.estudiantes.map((item: DatoEstudiante) => item.nombreCurso)
                .filter((value, index, self) => self.indexOf(value) === index);
              this.cursosNombre = cursosUnicos;
              this.aplicarFiltros();
            } else {
              this.datosOriginales.estudiantes = datosEjemplo[5];
              // Convertir explícitamente a string[]
              const cursosUnicos: string[] = datosEjemplo[5].map((item: any) => item.nombreCurso)
                .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index);
              this.cursosNombre = cursosUnicos;
              this.aplicarFiltros();
              this.mostrarError('Usando datos de ejemplo - No hay datos reales en la BD');
            }
          },
          error: (err) => {
            this.cargandoDatos = false;
            this.datosOriginales.estudiantes = datosEjemplo[5];
            const cursosUnicos: string[] = datosEjemplo[5].map((item: any) => item.nombreCurso)
              .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index);
            this.cursosNombre = cursosUnicos;
            this.aplicarFiltros();
            this.mostrarError('Error de conexión - Usando datos de ejemplo');
          }
        });
        break;
    }
  }

  aplicarFiltros(): void {
    this.destruirGrafico();
    this.destruirGraficosAdicionales();

    const dashboard = this.dashboardActivo;

    if (dashboard === 1) {
      let datos = [...this.datosOriginales.certificados];
      if (this.filtroAnio !== 'todos') {
        datos = datos.filter(item => item.anio?.toString() === this.filtroAnio);
      }
      if (this.filtroCurso !== 'todos') {
        datos = datos.filter(item => item.nombreCurso === this.filtroCurso);
      }
      const resumen: { [key: string]: number } = {};
      datos.forEach(item => {
        if (resumen[item.nombreCurso]) {
          resumen[item.nombreCurso] += item.cantidad;
        } else {
          resumen[item.nombreCurso] = item.cantidad;
        }
      });
      const datosGrafico = Object.keys(resumen).map(nombreCurso => ({
        nombreCurso: nombreCurso,
        cantidad: resumen[nombreCurso]
      }));
      this.crearGraficoCircular(datosGrafico);
    }
    else if (dashboard === 2) {
      let datos = [...this.datosOriginales.ranking];
      if (this.filtroCurso !== 'todos') {
        datos = datos.filter(item => item.nombreCurso === this.filtroCurso);
      }
      this.crearGraficoBarras(datos, 'Estudiantes');
    }
    else if (dashboard === 3) {
      let datos = [...this.datosOriginales.tendenciaCert];
      if (this.filtroAnio !== 'todos') {
        datos = datos.filter(item => item.anio?.toString() === this.filtroAnio);
      }
      datos.sort((a, b) => a.mes - b.mes);
      this.crearGraficoLinea(datos, 'Certificados emitidos', '#4caf50');
    }
    else if (dashboard === 4) {
      let datos = [...this.datosOriginales.tendenciaMat];
      if (this.filtroAnio !== 'todos') {
        datos = datos.filter(item => item.anio?.toString() === this.filtroAnio);
      }
      datos.sort((a, b) => a.mes - b.mes);
      this.crearGraficoLinea(datos, 'Matrículas', '#ff9800');
    }
    else if (dashboard === 5) {
      let datos = [...this.datosOriginales.estudiantes];
      if (this.filtroAnio !== 'todos') {
        datos = datos.filter(item => item.anio?.toString() === this.filtroAnio);
      }
      if (this.filtroCurso !== 'todos') {
        datos = datos.filter(item => item.nombreCurso === this.filtroCurso);
      }
      this.datosTablaFiltrados = datos;
      this.procesarDatosDetalle(datos);
    }
  }

  resetearFiltros(): void {
    this.filtroAnio = 'todos';
    this.filtroCurso = 'todos';
    this.aplicarFiltros();
  }

  procesarDatosDetalle(datos: DatoEstudiante[]): void {
    const agrupadoPorCurso: { [key: string]: any } = {};
    const evolucionAnual: { [key: string]: { [key: string]: number } } = {};

    datos.forEach(item => {
      if (!agrupadoPorCurso[item.nombreCurso]) {
        agrupadoPorCurso[item.nombreCurso] = {
          nombreCurso: item.nombreCurso,
          totalEstudiantes: 0,
          estudiantesPorAnio: {},
          totalResenas: Math.floor(Math.random() * 20) + 5
        };
      }

      agrupadoPorCurso[item.nombreCurso].totalEstudiantes += item.totalEstudiantes;

      if (!agrupadoPorCurso[item.nombreCurso].estudiantesPorAnio[item.anio]) {
        agrupadoPorCurso[item.nombreCurso].estudiantesPorAnio[item.anio] = 0;
      }
      agrupadoPorCurso[item.nombreCurso].estudiantesPorAnio[item.anio] += item.totalEstudiantes;

      if (!evolucionAnual[item.anio]) {
        evolucionAnual[item.anio] = {};
      }
      if (!evolucionAnual[item.anio][item.nombreCurso]) {
        evolucionAnual[item.anio][item.nombreCurso] = 0;
      }
      evolucionAnual[item.anio][item.nombreCurso] += item.totalEstudiantes;
    });

    const totalGeneral = Object.values(agrupadoPorCurso).reduce((sum: number, curso: any) => sum + curso.totalEstudiantes, 0);

    this.datosTablaAgrupados = Object.values(agrupadoPorCurso).map((curso: any) => {
      const porcentaje = totalGeneral > 0 ? Math.round((curso.totalEstudiantes / totalGeneral) * 100) : 0;

      const estudiantes2025 = curso.estudiantesPorAnio[2025] || 0;
      const estudiantes2026 = curso.estudiantesPorAnio[2026] || 0;
      let tendencia = 'estable';
      let variacion = 0;

      if (estudiantes2025 > 0) {
        variacion = Math.round(((estudiantes2026 - estudiantes2025) / estudiantes2025) * 100);
        tendencia = variacion > 0 ? 'subida' : variacion < 0 ? 'bajada' : 'estable';
      }

      const calificacionPromedio = (Math.random() * 2 + 3).toFixed(1);

      return {
        ...curso,
        porcentaje: porcentaje,
        tendencia: tendencia,
        variacion: Math.abs(variacion),
        esTop: porcentaje >= 25,
        calificacionPromedio: calificacionPromedio
      };
    });

    this.datosTablaAgrupados.sort((a, b) => b.totalEstudiantes - a.totalEstudiantes);

    const totalMatriculas = datos.length;
    const estudiantesUnicos = new Set(datos.map(d => `${d.nombreCurso}-${d.anio}`)).size;
    const tasaAprobacion = this.certificados.length > 0 ? Math.round((this.certificados.length / totalMatriculas) * 100) : 65;
    const promedioCalificacion = this.resumenDetalle.promedioCalificacion || 4.5;

    this.resumenDetalle = {
      totalEstudiantesUnicos: estudiantesUnicos,
      totalMatriculas: totalMatriculas,
      tasaAprobacion: tasaAprobacion,
      promedioCalificacion: promedioCalificacion
    };

    setTimeout(() => {
      this.crearGraficoEvolucionAnual(evolucionAnual);
      this.crearGraficoDistribucion();
    }, 100);
  }

  private crearGraficoEvolucionAnual(datosEvolucion: any): void {
    const canvas = document.getElementById('graficoEvolucionAnual') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chartEvolucion) {
      this.chartEvolucion.destroy();
    }

    const anios = ['2024', '2025', '2026'];
    const cursos = this.datosTablaAgrupados.map(c => c.nombreCurso);
    const colores = ['#4caf50', '#ff9800', '#2196f3', '#9c27b0', '#f44336'];

    const datasets = cursos.map((curso, index) => ({
      label: curso,
      data: anios.map(anio => datosEvolucion[anio]?.[curso] || 0),
      borderColor: colores[index % colores.length],
      backgroundColor: 'transparent',
      tension: 0.3,
      fill: false,
      pointRadius: 4,
      pointBackgroundColor: colores[index % colores.length]
    }));

    this.chartEvolucion = new Chart(canvas, {
      type: 'line',
      data: { labels: anios, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  private crearGraficoDistribucion(): void {
    const canvas = document.getElementById('graficoDistribucion') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chartDistribucion) {
      this.chartDistribucion.destroy();
    }

    this.chartDistribucion = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.datosTablaAgrupados.map(c => c.nombreCurso),
        datasets: [{
          label: 'Estudiantes',
          data: this.datosTablaAgrupados.map(c => c.totalEstudiantes),
          backgroundColor: '#42a5f5',
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: { y: { beginAtZero: true, title: { display: true, text: 'Cantidad de Estudiantes' } } },
        plugins: { legend: { display: false } }
      }
    });
  }

  private crearGraficoCircular(data: any[]): void {
    if (!this.canvasRef?.nativeElement) return;
    if (!data.length) {
      this.limpiarCanvas();
      return;
    }

    this.chartInstance = new Chart(this.canvasRef.nativeElement, {
      type: 'pie',
      data: {
        labels: data.map(item => item.nombreCurso),
        datasets: [{
          data: data.map(item => item.cantidad),
          backgroundColor: ['#4caf50', '#ff9800', '#2196f3', '#9c27b0', '#f44336', '#3f51b5']
        }]
      },
      options: { responsive: true, maintainAspectRatio: true }
    });
  }

  private crearGraficoBarras(data: any[], label: string): void {
    if (!this.canvasRef?.nativeElement) return;
    if (!data.length) {
      this.limpiarCanvas();
      return;
    }

    this.chartInstance = new Chart(this.canvasRef.nativeElement, {
      type: 'bar',
      data: {
        labels: data.map(item => item.nombreCurso),
        datasets: [{
          label: label,
          data: data.map(item => item.totalEstudiantes || item.cantidad || 0),
          backgroundColor: '#42a5f5',
          borderRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: { y: { beginAtZero: true, title: { display: true, text: 'Cantidad' } } }
      }
    });
  }

  private crearGraficoLinea(data: DatoTendencia[], label: string, color: string): void {
    if (!this.canvasRef?.nativeElement) return;
    if (!data.length) {
      this.limpiarCanvas();
      return;
    }

    const nombreMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const labels = data.map(item => `${nombreMeses[item.mes - 1]} ${item.anio}`);
    const valores = data.map(item => item.cantidad);

    this.chartInstance = new Chart(this.canvasRef.nativeElement, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: label,
          data: valores,
          borderColor: color,
          backgroundColor: color + '20',
          borderWidth: 2,
          tension: 0.3,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: color,
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.raw}`
            }
          }
        }
      }
    });
  }

  private limpiarCanvas(): void {
    if (!this.canvasRef?.nativeElement) return;

    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const width = this.canvasRef.nativeElement.width;
    const height = this.canvasRef.nativeElement.height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);

    ctx.font = '48px Arial';
    ctx.fillStyle = '#dee2e6';
    ctx.textAlign = 'center';
    ctx.fillText('📊', width / 2, height / 2 - 20);

    ctx.font = '16px Arial';
    ctx.fillStyle = '#adb5bd';
    ctx.fillText('No hay datos para los filtros seleccionados', width / 2, height / 2 + 40);

    ctx.font = '12px Arial';
    ctx.fillStyle = '#ced4da';
    ctx.fillText('Prueba cambiando los filtros de año o curso', width / 2, height / 2 + 70);
  }

  private mostrarError(mensaje: string): void {
    this.errorMessage = mensaje;
    setTimeout(() => this.errorMessage = null, 5000);
  }

  loadCursos(): void {
    if (this.idDocente && this.idDocente > 0) {
      this.cursoService.listarCursosPorDocente(this.idDocente)
        .subscribe((data: Curso[]) => {
          this.cursos = data;
          this.cursosNombre = data.map(c => c.nombreCurso);
        });
    }
  }

  loadCertificados(): void {
    if (this.idDocente && this.idDocente > 0) {
      this.certificadoService.listarCertificadosPorDocente(this.idDocente)
        .subscribe((data: CertificadoDocente[]) => this.certificados = data);
    }
  }

  loadProfileData(idPersona: number): void {
    this.usuarioService.obtenerPerfil(idPersona).subscribe(
      (data: Persona) => {
        this.profileData = data;
        if (this.profileData?.fechaDeNacimiento) {
          this.profileData.fechaDeNacimiento = new Date(this.profileData.fechaDeNacimiento).toISOString().split('T')[0];
        }
      },
      () => this.errorMessage = 'Error al cargar el perfil.'
    );
  }

  onUpdateProfile(): void {
    if (!this.profileData) return;
    this.usuarioService.actualizarPerfil(this.profileData.idPersona, this.profileData).subscribe(
      (response: string) => {
        this.successMessage = response;
        if (this.configModal) this.configModal.hide();
        if (this.currentUser) {
          this.currentUser.nombreCompleto = `${this.profileData?.nombres} ${this.profileData?.apellidos}`;
          this.authService.saveSession(this.currentUser);
          this.nombreDelDocente = this.currentUser.nombreCompleto;
        }
      },
      (err) => this.errorMessage = err.error?.message || 'Error al actualizar el perfil.'
    );
  }

  onLogout(): void {
    localStorage.removeItem('nombreDelDocente');
    this.docenteSessionService.clearNombreDocente();
    this.authService.logout();
    this.router.navigate(['/']);
  }

  onDeleteAccount(): void {
    if (this.confirmUsername !== this.currentUser?.username) {
      this.errorMessage = "El nombre de usuario no coincide.";
      return;
    }
    alert('Funcionalidad de eliminar cuenta aún no conectada al backend.');
  }

  navegarRegistrarCurso(): void {
    this.router.navigate([`/docente/${this.idDocente}/registrar-curso`]);
  }

  navegarActualizarCurso(idCurso: number): void {
    this.router.navigate(['/actualizar-curso', idCurso]);
  }

  navegarSeccion(idCurso: number): void {
    localStorage.setItem('idDocente', this.idDocente.toString());
    this.router.navigate(['/seccion/curso', idCurso]);
  }

  exportarExcel(): void {
    this.excelService.exportAsExcelFile(this.certificados, 'Certificados_Docente');
  }

  eliminarCurso(idCurso: number): void {
    if (confirm('¿Estás seguro de eliminar este curso?')) {
      this.cursoService.eliminarCurso(idCurso).subscribe({
        next: () => {
          alert('✅ Curso eliminado correctamente');
          this.loadCursos();
        },
        error: () => alert('❌ No se pudo eliminar el curso')
      });
    }
  }
}
