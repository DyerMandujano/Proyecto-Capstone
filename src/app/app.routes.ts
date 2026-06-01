import { Routes } from '@angular/router';
import { CursoComponent } from './components/curso/curso.component';
import { DocenteComponent } from './components/docente/docente.component';
import { RegistrarCursoComponent } from './components/curso/registrar-curso/registrar-curso.component';
import { ActualizarCursoComponent } from './components/curso/actualizar-curso/actualizar-curso.component';
import { SeccionComponent } from './components/seccion/seccion.component';
import { RegistrarSeccionComponent } from './components/seccion/registrar-seccion/registrar-seccion.component';
import { ActualizarSeccionComponent } from './components/seccion/actualizar-seccion/actualizar-seccion.component';
import { LeccionComponent } from './components/leccion/leccion.component';
import { RegistrarLeccionComponent } from './components/leccion/registrar-leccion/registrar-leccion.component';
import { ActualizarLeccionComponent } from './components/leccion/actualizar-leccion/actualizar-leccion.component';

// --- Imports de AMBOS (tu compañero y tú) ---
import { AutenticacionComponent } from './components/autenticacion/autenticacion.component';
import { EstudianteComponent } from './components/estudiante/estudiante.component';
import { VisualizarCursosComponent } from './components/estudiante/visualizar-cursos/visualizar-cursos.component';
// Asegúrate de que estos componentes existan (si te da error, verifica la ruta)
import { CursoDescripcionComponent } from './components/curso-descripcion/curso-descripcion.component'; 
import { CursoDetalleComponent } from './components/curso-detalle/curso-detalle.component';
import { authGuard } from './guards/auth.guard';

// --- ¡IMPORTANTE! Importar el Home ---
import { HomeComponent } from './components/home/home.component';
import { EvaluacionCursoComponent } from './components/evaluacion-curso/evaluacion-curso.component';
import { MisCertificadosComponent } from './components/mis-certificados/mis-certificados.component';

export const routes: Routes = [
  // 1. CORRECCIÓN: La ruta raíz carga el Home
  {
    path: '',
    component: HomeComponent 
  },

  // Rutas de visualización (Estudiante)
  {
    path: 'visualizar-cursos/:id',
    component: VisualizarCursosComponent,
    canActivate: [authGuard] // Recomendado protegerla
  },

  // Rutas de detalle de curso (Nuevas del merge)
  {
    path: 'curso/:id',
    component: CursoDescripcionComponent
  },
  {
    path: 'curso/:id/lecciones',
    component: CursoDetalleComponent,
    canActivate: [authGuard] // Recomendado protegerla
  },

  // Rutas de autenticación
  {
    path: 'login',
    component: AutenticacionComponent
  },
  {
    path: 'registro',
    component: AutenticacionComponent
  },

  // --- Rutas de gestión (Docente) ---
  {
    path: 'cursos',
    component: CursoComponent
  },
  {
    path: 'actualizar-curso/:id',
    component: ActualizarCursoComponent
  },
  {
    path: 'docente/:id',
    component: DocenteComponent
  },
  { 
    path: 'actualizar-leccion/:id', 
    component: ActualizarLeccionComponent 
  },
  {
    path: 'docente/:id/registrar-curso',
    component: RegistrarCursoComponent
  },
  {
    path: 'seccion/curso/:id',
    component: SeccionComponent
  },
  {
    path: 'curso/:id/registrar-seccion',
    component: RegistrarSeccionComponent
  },
  {
    path: 'actualizar-seccion/:id',
    component: ActualizarSeccionComponent
  },
  {
    path: 'leccion/seccion/:id',
    component: LeccionComponent
  },
  {
    path: 'seccion/:id/registrar-leccion',
    component: RegistrarLeccionComponent
  },
  {
    path: 'evaluacion/seccion/:id',
    component: EvaluacionCursoComponent
  },
  {
    path: 'certificados/estudiante/:id',
    component: MisCertificadosComponent
  },

  // Ruta antigua de estudiante (si aún la usas)
  {
    path: 'estudiante/dashboard',
    component: EstudianteComponent,
    canActivate: [authGuard]
  },

  // 2. CORRECCIÓN: Ruta comodín redirige a Home ('') en lugar de Login
  {
    path: '**',
    redirectTo: ''
  }
];