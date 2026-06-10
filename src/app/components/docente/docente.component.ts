import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
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

@Component({
  selector: 'app-docente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './docente.component.html',
  styleUrls: ['./docente.component.css'],
  host: { ngSkipHydration: 'true' }
})
export class DocenteComponent implements OnInit, AfterViewInit {
  @ViewChild('miGrafico', { static: false }) canvasRef!: ElementRef;

  dashboardActivo: number = 1;
  chartInstance: Chart | null = null;
  datosTablaAgrupados: any[] = [];
  resumenDetalle: any = {};
  cargandoDatos: boolean = false;
  fechaActual: Date = new Date();

  // Filtros
  filtroAnio: string = 'todos';
  filtroCurso: string = 'todos';
  cursosNombre: string[] = [];

  // Gráficos adicionales Dashboard 5
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

  // Datos almacenados
  private datosCertificados: any[] = [];
  private datosRanking: any[] = [];
  private datosTendenciaCert: any[] = [];
  private datosTendenciaMat: any[] = [];
  private datosEstudiantes: any[] = [];

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

    this.idDocente = Number(this.route.snapshot.paramMap.get('idDocente')) ||
                     Number(this.route.snapshot.paramMap.get('id')) ||
                     this.docenteSessionService.getIdDocente() || 0;

    if (this.idDocente > 0) {
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
      if (this.idDocente > 0) {
        this.cargarDashboard(this.dashboardActivo);
      }
    }, 500);
  }

  cambiarDashboard(numero: number): void {
    this.dashboardActivo = numero;
    this.cargarDashboard(numero);
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
    this.destruirGrafico();
    this.destruirGraficosAdicionales();

    this.cargandoDatos = true;

    const datosEjemplo: any = {
      1: [
        { nombreCurso: 'Gasfitería Básica', cantidad: 25 },
        { nombreCurso: 'Electricidad Domiciliaria', cantidad: 22 },
        { nombreCurso: 'Carpintería General', cantidad: 18 },
        { nombreCurso: 'Gasfitería Avanzada', cantidad: 12 },
        { nombreCurso: 'Albañilería Estructural', cantidad: 10 },
      ],
      2: [
        { nombreCurso: 'Gasfitería Básica', totalEstudiantes: 25 },
        { nombreCurso: 'Electricidad Domiciliaria', totalEstudiantes: 22 },
        { nombreCurso: 'Carpintería General', totalEstudiantes: 18 },
        { nombreCurso: 'Gasfitería Avanzada', totalEstudiantes: 12 },
        { nombreCurso: 'Albañilería Estructural', totalEstudiantes: 10 },
      ],
      3: [
        { anio: 2024, mes: 1, cantidad: 5 }, { anio: 2024, mes: 2, cantidad: 7 },
        { anio: 2024, mes: 3, cantidad: 10 }, { anio: 2025, mes: 1, cantidad: 3 },
        { anio: 2025, mes: 2, cantidad: 4 }, { anio: 2026, mes: 1, cantidad: 12 },
        { anio: 2026, mes: 2, cantidad: 15 },
      ],
      4: [
        { anio: 2024, mes: 1, cantidad: 10 }, { anio: 2024, mes: 2, cantidad: 12 },
        { anio: 2024, mes: 3, cantidad: 15 }, { anio: 2025, mes: 1, cantidad: 5 },
        { anio: 2025, mes: 2, cantidad: 6 }, { anio: 2026, mes: 1, cantidad: 18 },
        { anio: 2026, mes: 2, cantidad: 20 },
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
        { nombreCurso: 'Carpintería General', totalEstudiantes: 28, anio: 2026, mes: 3 },
      ],
    };

    switch (numero) {
      case 1:
        this.dashboardService.getCertificadosPorCurso(this.idDocente).subscribe({
          next: (data) => {
            this.cargandoDatos = false;
            if (data && data.length > 0) {
              this.datosCertificados = data.map((item: any[]) => ({
                nombreCurso: item[0],
                cantidad: item[1]
              }));
            } else {
              this.datosCertificados = datosEjemplo[1];
            }
            this.mostrarGraficoPie();
          },
          error: () => {
            this.cargandoDatos = false;
            this.datosCertificados = datosEjemplo[1];
            this.mostrarGraficoPie();
            this.mostrarError('Usando datos de ejemplo');
          }
        });
        break;
      case 2:
        this.dashboardService.getRankingCursos(this.idDocente).subscribe({
          next: (data) => {
            this.cargandoDatos = false;
            if (data && data.length > 0) {
              this.datosRanking = data.map((item: any[]) => ({
                nombreCurso: item[0],
                totalEstudiantes: item[1]
              }));
            } else {
              this.datosRanking = datosEjemplo[2];
            }
            this.mostrarGraficoBarras();
          },
          error: () => {
            this.cargandoDatos = false;
            this.datosRanking = datosEjemplo[2];
            this.mostrarGraficoBarras();
            this.mostrarError('Usando datos de ejemplo');
          }
        });
        break;
      case 3:
        this.dashboardService.getTendenciaCertificados(this.idDocente).subscribe({
          next: (data) => {
            this.cargandoDatos = false;
            if (data && data.length > 0) {
              this.datosTendenciaCert = data.map((item: any[]) => ({
                anio: item[0],
                mes: item[1],
                cantidad: item[2]
              }));
            } else {
              this.datosTendenciaCert = datosEjemplo[3];
            }
            this.mostrarGraficoLineaCertificados();
          },
          error: () => {
            this.cargandoDatos = false;
            this.datosTendenciaCert = datosEjemplo[3];
            this.mostrarGraficoLineaCertificados();
            this.mostrarError('Usando datos de ejemplo');
          }
        });
        break;
      case 4:
        this.dashboardService.getTendenciaMatriculas(this.idDocente).subscribe({
          next: (data) => {
            this.cargandoDatos = false;
            if (data && data.length > 0) {
              this.datosTendenciaMat = data.map((item: any[]) => ({
                anio: item[0],
                mes: item[1],
                cantidad: item[2]
              }));
            } else {
              this.datosTendenciaMat = datosEjemplo[4];
            }
            this.mostrarGraficoLineaMatriculas();
          },
          error: () => {
            this.cargandoDatos = false;
            this.datosTendenciaMat = datosEjemplo[4];
            this.mostrarGraficoLineaMatriculas();
            this.mostrarError('Usando datos de ejemplo');
          }
        });
        break;
      case 5:
        this.dashboardService.getEstudiantesPorCurso(this.idDocente).subscribe({
          next: (data) => {
            this.cargandoDatos = false;
            if (data && data.length > 0) {
              this.datosEstudiantes = data.map((item: any[]) => ({
                nombreCurso: item[0],
                totalEstudiantes: item[1],
                anio: item[2],
                mes: item[3]
              }));
              const cursosTemp: string[] = [];
              this.datosEstudiantes.forEach((item: any) => {
                if (!cursosTemp.includes(item.nombreCurso)) cursosTemp.push(item.nombreCurso);
              });
              this.cursosNombre = cursosTemp;
            } else {
              this.datosEstudiantes = datosEjemplo[5];
              const cursosTemp: string[] = [];
              datosEjemplo[5].forEach((item: any) => {
                if (!cursosTemp.includes(item.nombreCurso)) cursosTemp.push(item.nombreCurso);
              });
              this.cursosNombre = cursosTemp;
            }
            this.procesarDatosDetalle(this.datosEstudiantes);
          },
          error: () => {
            this.cargandoDatos = false;
            this.datosEstudiantes = datosEjemplo[5];
            const cursosTemp: string[] = [];
            datosEjemplo[5].forEach((item: any) => {
              if (!cursosTemp.includes(item.nombreCurso)) cursosTemp.push(item.nombreCurso);
            });
            this.cursosNombre = cursosTemp;
            this.procesarDatosDetalle(this.datosEstudiantes);
            this.mostrarError('Usando datos de ejemplo');
          }
        });
        break;
    }
  }

  // ========== DASHBOARD 1: GRÁFICO DE PASTEL (PIE) ==========
  private mostrarGraficoPie(): void {
    if (!this.canvasRef?.nativeElement || !this.datosCertificados.length) return;
    this.chartInstance = new Chart(this.canvasRef.nativeElement, {
      type: 'pie',
      data: {
        labels: this.datosCertificados.map((d: any) => d.nombreCurso),
        datasets: [{
          data: this.datosCertificados.map((d: any) => d.cantidad),
          backgroundColor: ['#4caf50', '#ff9800', '#2196f3', '#9c27b0', '#f44336', '#3f51b5']
        }]
      },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } } }
    });
  }

  // ========== DASHBOARD 2: GRÁFICO DE BARRAS ==========
  private mostrarGraficoBarras(): void {
    if (!this.canvasRef?.nativeElement || !this.datosRanking.length) return;
    this.chartInstance = new Chart(this.canvasRef.nativeElement, {
      type: 'bar',
      data: {
        labels: this.datosRanking.map((d: any) => d.nombreCurso),
        datasets: [{
          label: 'Estudiantes',
          data: this.datosRanking.map((d: any) => d.totalEstudiantes),
          backgroundColor: '#42a5f5',
          borderRadius: 5
        }]
      },
      options: { responsive: true, maintainAspectRatio: true, scales: { y: { beginAtZero: true } } }
    });
  }

  // ========== DASHBOARD 3: TENDENCIA CERTIFICADOS (LÍNEA) ==========
  private mostrarGraficoLineaCertificados(): void {
    if (!this.canvasRef?.nativeElement || !this.datosTendenciaCert.length) return;
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    this.chartInstance = new Chart(this.canvasRef.nativeElement, {
      type: 'line',
      data: {
        labels: this.datosTendenciaCert.map((d: any) => `${meses[d.mes - 1]} ${d.anio}`),
        datasets: [{
          label: 'Certificados emitidos',
          data: this.datosTendenciaCert.map((d: any) => d.cantidad),
          borderColor: '#4caf50',
          backgroundColor: '#4caf5020',
          borderWidth: 2,
          tension: 0.3,
          fill: true,
          pointRadius: 4
        }]
      },
      options: { responsive: true, maintainAspectRatio: true }
    });
  }

  // ========== DASHBOARD 4: TENDENCIA MATRÍCULAS (LÍNEA) ==========
  private mostrarGraficoLineaMatriculas(): void {
    if (!this.canvasRef?.nativeElement || !this.datosTendenciaMat.length) return;
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    this.chartInstance = new Chart(this.canvasRef.nativeElement, {
      type: 'line',
      data: {
        labels: this.datosTendenciaMat.map((d: any) => `${meses[d.mes - 1]} ${d.anio}`),
        datasets: [{
          label: 'Matrículas',
          data: this.datosTendenciaMat.map((d: any) => d.cantidad),
          borderColor: '#ff9800',
          backgroundColor: '#ff980020',
          borderWidth: 2,
          tension: 0.3,
          fill: true,
          pointRadius: 4
        }]
      },
      options: { responsive: true, maintainAspectRatio: true }
    });
  }

  // ========== DASHBOARD 5: GRÁFICO DE RADAR (en canvas principal) ==========
  private mostrarGraficoRadar(datos: any[]): void {
    if (!this.canvasRef?.nativeElement || !datos.length) return;

    this.destruirGrafico();

    this.chartInstance = new Chart(this.canvasRef.nativeElement, {
      type: 'radar',
      data: {
        labels: datos.map(d => d.curso),
        datasets: [
          {
            label: 'Total Estudiantes',
            data: datos.map(d => d.total),
            backgroundColor: 'rgba(102, 126, 234, 0.2)',
            borderColor: '#667eea',
            borderWidth: 2,
            pointBackgroundColor: '#667eea',
            pointBorderColor: '#fff',
            pointRadius: 5,
          },
          {
            label: 'Crecimiento (%)',
            data: datos.map(d => d.crecimiento),
            backgroundColor: 'rgba(76, 175, 80, 0.2)',
            borderColor: '#4caf50',
            borderWidth: 2,
            pointBackgroundColor: '#4caf50',
            pointBorderColor: '#fff',
            pointRadius: 5,
          },
          {
            label: 'Satisfacción (%)',
            data: datos.map(d => d.satisfaccion),
            backgroundColor: 'rgba(255, 152, 0, 0.2)',
            borderColor: '#ff9800',
            borderWidth: 2,
            pointBackgroundColor: '#ff9800',
            pointBorderColor: '#fff',
            pointRadius: 5,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'top' },
          tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}` } }
        },
        scales: {
          r: {
            beginAtZero: true,
            ticks: { stepSize: 20, backdropColor: 'transparent' },
            grid: { color: '#e2e8f0' },
            angleLines: { color: '#e2e8f0' },
            pointLabels: { font: { size: 12, weight: 'bold' } }
          }
        }
      }
    });
  }

  aplicarFiltros(): void {
    if (this.dashboardActivo === 5 && this.datosEstudiantes.length) {
      let datos = [...this.datosEstudiantes];
      if (this.filtroAnio !== 'todos') {
        datos = datos.filter((item: any) => item.anio?.toString() === this.filtroAnio);
      }
      if (this.filtroCurso !== 'todos') {
        datos = datos.filter((item: any) => item.nombreCurso === this.filtroCurso);
      }
      this.procesarDatosDetalle(datos);
    }
  }

  resetearFiltros(): void {
    this.filtroAnio = 'todos';
    this.filtroCurso = 'todos';
    if (this.dashboardActivo === 5 && this.datosEstudiantes.length) {
      this.procesarDatosDetalle(this.datosEstudiantes);
    }
  }

  procesarDatosDetalle(datos: any[]): void {
    const agrupadoPorCurso: { [key: string]: any } = {};
    const evolucionAnual: { [key: string]: { [key: string]: number } } = {};
    const datosRadar: { curso: string; total: number; crecimiento: number; satisfaccion: number }[] = [];

    datos.forEach((item: any) => {
      if (!agrupadoPorCurso[item.nombreCurso]) {
        agrupadoPorCurso[item.nombreCurso] = {
          nombreCurso: item.nombreCurso,
          totalEstudiantes: 0,
          estudiantesPorAnio: {},
          totalResenas: Math.floor(Math.random() * 20) + 5,
        };
      }
      agrupadoPorCurso[item.nombreCurso].totalEstudiantes += item.totalEstudiantes;
      agrupadoPorCurso[item.nombreCurso].estudiantesPorAnio[item.anio] =
        (agrupadoPorCurso[item.nombreCurso].estudiantesPorAnio[item.anio] || 0) + item.totalEstudiantes;

      evolucionAnual[item.anio] = evolucionAnual[item.anio] || {};
      evolucionAnual[item.anio][item.nombreCurso] =
        (evolucionAnual[item.anio][item.nombreCurso] || 0) + item.totalEstudiantes;
    });

    // Preparar datos para radar
    Object.values(agrupadoPorCurso).forEach((curso: any) => {
      const estudiantes2024 = curso.estudiantesPorAnio[2024] || 0;
      const estudiantes2025 = curso.estudiantesPorAnio[2025] || 0;
      const estudiantes2026 = curso.estudiantesPorAnio[2026] || 0;
      const crecimiento = estudiantes2025 > 0
        ? Math.round(((estudiantes2026 - estudiantes2025) / estudiantes2025) * 100)
        : (estudiantes2026 > 0 ? 100 : 0);

      datosRadar.push({
        curso: curso.nombreCurso,
        total: curso.totalEstudiantes,
        crecimiento: Math.min(Math.max(crecimiento, 0), 100),
        satisfaccion: Math.floor(Math.random() * 30) + 70
      });
    });

    const totalGeneral = Object.values(agrupadoPorCurso).reduce((sum: number, curso: any) => sum + curso.totalEstudiantes, 0);

    this.datosTablaAgrupados = Object.values(agrupadoPorCurso).map((curso: any) => {
      const porcentaje = totalGeneral > 0 ? Math.round((curso.totalEstudiantes / totalGeneral) * 100) : 0;
      const estudiantes2025 = curso.estudiantesPorAnio[2025] || 0;
      const estudiantes2026 = curso.estudiantesPorAnio[2026] || 0;
      let variacion = 0;
      let tendencia = 'estable';
      if (estudiantes2025 > 0) {
        variacion = Math.round(((estudiantes2026 - estudiantes2025) / estudiantes2025) * 100);
        tendencia = variacion > 0 ? 'subida' : variacion < 0 ? 'bajada' : 'estable';
      }
      return {
        ...curso,
        porcentaje,
        tendencia,
        variacion: Math.abs(variacion),
        esTop: porcentaje >= 25,
        calificacionPromedio: (Math.random() * 2 + 3).toFixed(1),
      };
    });

    this.datosTablaAgrupados.sort((a, b) => b.totalEstudiantes - a.totalEstudiantes);
    const totalMatriculas = datos.length;
    const estudiantesUnicos = new Set(datos.map((d: any) => `${d.nombreCurso}-${d.anio}`)).size;
    const tasaAprobacion = this.certificados.length > 0 ? Math.round((this.certificados.length / totalMatriculas) * 100) : 65;

    this.resumenDetalle = {
      totalEstudiantesUnicos: estudiantesUnicos,
      totalMatriculas: totalMatriculas,
      tasaAprobacion: tasaAprobacion,
      promedioCalificacion: 4.5,
    };

    setTimeout(() => {
      // Mostrar RADAR en el canvas principal (#miGrafico)
      this.mostrarGraficoRadar(datosRadar);
      this.crearGraficoEvolucionAnual(evolucionAnual);
      this.crearGraficoDistribucion();
    }, 100);
  }

  private crearGraficoEvolucionAnual(datosEvolucion: any): void {
    const canvas = document.getElementById('graficoEvolucionAnual') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.chartEvolucion) this.chartEvolucion.destroy();

    const anios = ['2024', '2025', '2026'];
    const cursos = this.datosTablaAgrupados.map((c: any) => c.nombreCurso);
    const colores = ['#667eea', '#4caf50', '#ff9800', '#9c27b0', '#f44336'];

    this.chartEvolucion = new Chart(canvas, {
      type: 'line',
      data: {
        labels: anios,
        datasets: cursos.map((curso: string, index: number) => ({
          label: curso,
          data: anios.map((anio) => datosEvolucion[anio]?.[curso] || 0),
          borderColor: colores[index % colores.length],
          tension: 0.3,
          fill: false,
          pointRadius: 4,
        })),
      },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } } },
    });
  }

  private crearGraficoDistribucion(): void {
    const canvas = document.getElementById('graficoDistribucion') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.chartDistribucion) this.chartDistribucion.destroy();

    this.chartDistribucion = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.datosTablaAgrupados.map((c: any) => c.nombreCurso),
        datasets: [{
          label: 'Estudiantes',
          data: this.datosTablaAgrupados.map((c: any) => c.totalEstudiantes),
          backgroundColor: '#42a5f5',
          borderRadius: 8,
        }],
      },
      options: { responsive: true, maintainAspectRatio: true, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } },
    });
  }

  private mostrarError(mensaje: string): void {
    this.errorMessage = mensaje;
    setTimeout(() => (this.errorMessage = null), 5000);
  }

  loadCursos(): void {
    if (this.idDocente && this.idDocente > 0) {
      this.cursoService.listarCursosPorDocente(this.idDocente).subscribe((data: Curso[]) => {
        this.cursos = data;
        this.cursosNombre = data.map((c) => c.nombreCurso);
      });
    }
  }

  loadCertificados(): void {
    if (this.idDocente && this.idDocente > 0) {
      this.certificadoService.listarCertificadosPorDocente(this.idDocente).subscribe((data: CertificadoDocente[]) => (this.certificados = data));
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
      () => (this.errorMessage = 'Error al cargar el perfil.')
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
      (err) => (this.errorMessage = err.error?.message || 'Error al actualizar el perfil.')
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
      this.errorMessage = 'El nombre de usuario no coincide.';
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
        error: () => alert('❌ No se pudo eliminar el curso'),
      });
    }
  }
}
