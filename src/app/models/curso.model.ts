export interface Curso {
  idCurso: number;
  idDocente: number;
  idCategoria: number;
  nombreCurso: string;
  descripcion: string;
  resumen: string;
  nivel: string;
  duracionMin: number;
  fechaPublicacion: string;
  imagenCurso1: string;
  imagenCurso2: string;
  estado: number;
}