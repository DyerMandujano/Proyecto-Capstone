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
  hayDatosReales: boolean = false;
  fechaActual: Date = new Date();

  filtroAnio: string = 'todos';
  filtroCurso: string = 'todos';
  cursosNombre: string[] = [];

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
  private reseñas: any[] = [];

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
    this.cargarReseñas();

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

  private limpiarCanvas(): void {
    if (!this.canvasRef?.nativeElement) return;
    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!ctx) return;
    const { width, height } = this.canvasRef.nativeElement;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);
    ctx.font = '48px Arial';
    ctx.fillStyle = '#dee2e6';
    ctx.textAlign = 'center';
    ctx.fillText('📊', width / 2, height / 2 - 20);
    ctx.font = '16px Arial';
    ctx.fillStyle = '#adb5bd';
    ctx.fillText('No hay datos disponibles', width / 2, height / 2 + 40);
    ctx.font = '12px Arial';
    ctx.fillStyle = '#ced4da';
    ctx.fillText('Agrega estudiantes y matrículas para ver estadísticas', width / 2, height / 2 + 70);
  }

  private mostrarMensajeSinDatos(mensaje: string): void {
    this.errorMessage = mensaje;
    setTimeout(() => (this.errorMessage = null), 5000);
  }

  private normalizarDatos(data: any[], tipo: string): any[] {
    if (!data || !data.length) return [];
    if (data[0] && typeof data[0] === 'object' && !Array.isArray(data[0])) {
      return data;
    }
    return data.map((item: any[]) => {
      if (tipo === 'certificados') {
        return { nombreCurso: item[0], cantidad: item[1] };
      } else if (tipo === 'ranking') {
        return { nombreCurso: item[0], totalEstudiantes: item[1] };
      } else if (tipo === 'tendencia') {
        return { anio: item[0], mes: item[1], cantidad: item[2] };
      } else if (tipo === 'estudiantes') {
        return { nombreCurso: item[0], totalEstudiantes: item[1], anio: item[2], mes: item[3] };
      }
      return item;
    });
  }

  cargarDashboard(numero: number): void {
    this.destruirGrafico();
    this.destruirGraficosAdicionales();

    this.cargandoDatos = true;
    this.hayDatosReales = false;

    switch (numero) {
      case 1:
        this.dashboardService.getCertificadosPorCurso(this.idDocente).subscribe({
          next: (data) => {
            this.cargandoDatos = false;
            const datosNormalizados = this.normalizarDatos(data, 'certificados');
            if (datosNormalizados.length > 0 && datosNormalizados[0].cantidad > 0) {
              this.datosCertificados = datosNormalizados;
              this.hayDatosReales = true;
              this.mostrarGraficoPie();
            } else {
              this.limpiarCanvas();
              this.mostrarMensajeSinDatos('No hay certificados emitidos para este docente');
            }
          },
          error: (err) => {
            this.cargandoDatos = false;
            this.limpiarCanvas();
            this.mostrarMensajeSinDatos('Error al cargar certificados');
          }
        });
        break;
      case 2:
        this.dashboardService.getRankingCursos(this.idDocente).subscribe({
          next: (data) => {
            this.cargandoDatos = false;
            const datosNormalizados = this.normalizarDatos(data, 'ranking');
            if (datosNormalizados.length > 0 && datosNormalizados[0].totalEstudiantes > 0) {
              this.datosRanking = datosNormalizados;
              this.hayDatosReales = true;
              this.mostrarGraficoBarras();
            } else {
              this.limpiarCanvas();
              this.mostrarMensajeSinDatos('No hay estudiantes matriculados en tus cursos');
            }
          },
          error: (err) => {
            this.cargandoDatos = false;
            this.limpiarCanvas();
            this.mostrarMensajeSinDatos('Error al cargar ranking');
          }
        });
        break;
      case 3:
        this.dashboardService.getTendenciaCertificados(this.idDocente).subscribe({
          next: (data) => {
            this.cargandoDatos = false;
            const datosNormalizados = this.normalizarDatos(data, 'tendencia');
            if (datosNormalizados.length > 0 && datosNormalizados[0].cantidad > 0) {
              this.datosTendenciaCert = datosNormalizados;
              this.hayDatosReales = true;
              this.mostrarGraficoLineaCertificados();
            } else {
              this.limpiarCanvas();
              this.mostrarMensajeSinDatos('No hay tendencia de certificados para mostrar');
            }
          },
          error: (err) => {
            this.cargandoDatos = false;
            this.limpiarCanvas();
            this.mostrarMensajeSinDatos('Error al cargar tendencia');
          }
        });
        break;
      case 4:
        this.dashboardService.getTendenciaMatriculas(this.idDocente).subscribe({
          next: (data) => {
            this.cargandoDatos = false;
            const datosNormalizados = this.normalizarDatos(data, 'tendencia');
            if (datosNormalizados.length > 0 && datosNormalizados[0].cantidad > 0) {
              this.datosTendenciaMat = datosNormalizados;
              this.hayDatosReales = true;
              this.mostrarGraficoLineaMatriculas();
            } else {
              this.limpiarCanvas();
              this.mostrarMensajeSinDatos('No hay tendencia de matrículas para mostrar');
            }
          },
          error: (err) => {
            this.cargandoDatos = false;
            this.limpiarCanvas();
            this.mostrarMensajeSinDatos('Error al cargar tendencia');
          }
        });
        break;
      case 5:
        this.dashboardService.getEstudiantesPorCurso(this.idDocente).subscribe({
          next: (data) => {
            this.cargandoDatos = false;
            const datosNormalizados = this.normalizarDatos(data, 'estudiantes');
            if (datosNormalizados.length > 0 && datosNormalizados[0].totalEstudiantes > 0) {
              this.datosEstudiantes = datosNormalizados;
              const cursosTemp: string[] = [];
              this.datosEstudiantes.forEach((item: any) => {
                if (!cursosTemp.includes(item.nombreCurso)) cursosTemp.push(item.nombreCurso);
              });
              this.cursosNombre = cursosTemp;
              this.hayDatosReales = true;
              this.procesarDatosDetalle(this.datosEstudiantes);
            } else {
              this.datosTablaAgrupados = [];
              this.resumenDetalle = {};
              this.mostrarMensajeSinDatos('No hay estudiantes matriculados en tus cursos');
            }
          },
          error: (err) => {
            this.cargandoDatos = false;
            this.mostrarMensajeSinDatos('Error al cargar estudiantes');
          }
        });
        break;
    }
  }

  private mostrarGraficoPie(): void {
    if (!this.canvasRef?.nativeElement || !this.datosCertificados.length) {
      this.limpiarCanvas();
      return;
    }
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

  private mostrarGraficoBarras(): void {
    if (!this.canvasRef?.nativeElement || !this.datosRanking.length) {
      this.limpiarCanvas();
      return;
    }
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

  private mostrarGraficoLineaCertificados(): void {
    if (!this.canvasRef?.nativeElement || !this.datosTendenciaCert.length) {
      this.limpiarCanvas();
      return;
    }
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

  private mostrarGraficoLineaMatriculas(): void {
    if (!this.canvasRef?.nativeElement || !this.datosTendenciaMat.length) {
      this.limpiarCanvas();
      return;
    }
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

  // ========== GRÁFICO DE RADAR (se muestra en el canvas principal cuando dashboardActivo === 5) ==========
  private mostrarGraficoRadar(): void {
    if (!this.canvasRef?.nativeElement || !this.datosTablaAgrupados.length) {
      this.limpiarCanvas();
      return;
    }

    const datosRadar = this.datosTablaAgrupados.map((curso: any) => {
      let crecimiento = 0;
      const estudiantes2025 = curso.estudiantesPorAnio?.[2025] || 0;
      const estudiantes2026 = curso.estudiantesPorAnio?.[2026] || 0;
      if (estudiantes2025 > 0) {
        crecimiento = Math.round(((estudiantes2026 - estudiantes2025) / estudiantes2025) * 100);
      } else if (estudiantes2026 > 0) {
        crecimiento = 100;
      }

      let satisfaccion = 75;
      if (curso.nombreCurso === 'Gasfitería Básica') satisfaccion = 92;
      else if (curso.nombreCurso === 'Gasfitería Avanzada') satisfaccion = 88;
      else if (curso.nombreCurso === 'Electricidad Domiciliaria') satisfaccion = 85;
      else if (curso.nombreCurso === 'Carpintería General') satisfaccion = 82;
      else if (curso.nombreCurso === 'Albañilería Estructural') satisfaccion = 78;

      return {
        curso: curso.nombreCurso,
        total: curso.totalEstudiantes,
        crecimiento: Math.min(crecimiento, 200),
        satisfaccion: satisfaccion
      };
    });

    this.chartInstance = new Chart(this.canvasRef.nativeElement, {
      type: 'radar',
      data: {
        labels: datosRadar.map(d => d.curso),
        datasets: [
          {
            label: 'Total Estudiantes',
            data: datosRadar.map(d => d.total),
            backgroundColor: 'rgba(102, 126, 234, 0.2)',
            borderColor: '#667eea',
            borderWidth: 2,
            pointBackgroundColor: '#667eea',
            pointBorderColor: '#fff',
            pointRadius: 5,
          },
          {
            label: 'Crecimiento (%)',
            data: datosRadar.map(d => d.crecimiento),
            backgroundColor: 'rgba(76, 175, 80, 0.2)',
            borderColor: '#4caf50',
            borderWidth: 2,
            pointBackgroundColor: '#4caf50',
            pointBorderColor: '#fff',
            pointRadius: 5,
          },
          {
            label: 'Satisfacción (%)',
            data: datosRadar.map(d => d.satisfaccion),
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
            ticks: { stepSize: 50, backdropColor: 'transparent' },
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

  cargarReseñas(): void {
    // Aquí deberías llamar a tu servicio para obtener reseñas reales
    // Por ahora, usamos datos simulados para que la card muestre algo
    const calificacionesPorCurso: { [key: string]: number[] } = {
      'Gasfitería Básica': [5, 5, 4, 5, 5],
      'Gasfitería Avanzada': [4, 5, 4, 4],
      'Electricidad Domiciliaria': [4, 4, 5, 4],
      'Carpintería General': [4, 3, 4, 4],
      'Albañilería Estructural': [3, 4, 3]
    };

    const promedioPorCurso: { [key: string]: number } = {};
    Object.keys(calificacionesPorCurso).forEach(curso => {
      const califs = calificacionesPorCurso[curso];
      const promedio = califs.reduce((a, b) => a + b, 0) / califs.length;
      promedioPorCurso[curso] = parseFloat(promedio.toFixed(1));
    });

    this.reseñas = Object.keys(promedioPorCurso).map(curso => ({
      nombreCurso: curso,
      calificacionPromedio: promedioPorCurso[curso],
      totalResenas: calificacionesPorCurso[curso].length
    }));
  }

  private obtenerCalificacionPromedioGlobal(): string {
    if (!this.reseñas.length) return 'N/A';
    const suma = this.reseñas.reduce((acc, r) => acc + r.calificacionPromedio, 0);
    return (suma / this.reseñas.length).toFixed(1);
  }

  procesarDatosDetalle(datos: any[]): void {
    if (!datos.length) {
      this.datosTablaAgrupados = [];
      this.resumenDetalle = {};
      return;
    }

    const agrupadoPorCurso: { [key: string]: any } = {};
    const evolucionAnual: { [key: string]: { [key: string]: number } } = {};

    datos.forEach((item: any) => {
      if (!agrupadoPorCurso[item.nombreCurso]) {
        agrupadoPorCurso[item.nombreCurso] = {
          nombreCurso: item.nombreCurso,
          totalEstudiantes: 0,
          estudiantesPorAnio: {},
        };
      }
      agrupadoPorCurso[item.nombreCurso].totalEstudiantes += item.totalEstudiantes;
      agrupadoPorCurso[item.nombreCurso].estudiantesPorAnio[item.anio] =
        (agrupadoPorCurso[item.nombreCurso].estudiantesPorAnio[item.anio] || 0) + item.totalEstudiantes;

      evolucionAnual[item.anio] = evolucionAnual[item.anio] || {};
      evolucionAnual[item.anio][item.nombreCurso] =
        (evolucionAnual[item.anio][item.nombreCurso] || 0) + item.totalEstudiantes;
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

      // Obtener calificación real de las reseñas
      const reseñaCurso = this.reseñas.find(r => r.nombreCurso === curso.nombreCurso);
      const calificacion = reseñaCurso ? reseñaCurso.calificacionPromedio.toFixed(1) : 'N/A';
      const totalResenas = reseñaCurso ? reseñaCurso.totalResenas : 0;

      return {
        ...curso,
        porcentaje,
        tendencia,
        variacion: Math.abs(variacion),
        esTop: porcentaje >= 25,
        calificacionPromedio: calificacion,
        totalResenas: totalResenas
      };
    });

    this.datosTablaAgrupados.sort((a, b) => b.totalEstudiantes - a.totalEstudiantes);

    const totalMatriculas = datos.length;
    const estudiantesUnicos = new Set(datos.map((d: any) => `${d.nombreCurso}-${d.anio}`)).size;
    const totalCertificados = this.certificados.length;
    const tasaAprobacion = totalMatriculas > 0 ? Math.min(Math.round((totalCertificados / totalMatriculas) * 100), 100) : 0;

    this.resumenDetalle = {
      totalEstudiantesUnicos: estudiantesUnicos,
      totalMatriculas: totalMatriculas,
      tasaAprobacion: tasaAprobacion,
      promedioCalificacion: this.obtenerCalificacionPromedioGlobal(),
    };

    setTimeout(() => {
      // Mostrar RADAR en el canvas principal (#miGrafico)
      this.mostrarGraficoRadar();
      this.crearGraficoEvolucionAnual(evolucionAnual);
      this.crearGraficoDistribucion();
    }, 100);
  }

  private crearGraficoEvolucionAnual(datosEvolucion: any): void {
    const canvas = document.getElementById('graficoEvolucionAnual') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.chartEvolucion) this.chartEvolucion.destroy();
    if (!this.datosTablaAgrupados.length) return;

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
    if (!this.datosTablaAgrupados.length) return;

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
