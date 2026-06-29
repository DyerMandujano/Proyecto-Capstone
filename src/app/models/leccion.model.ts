import { Material } from './material.model'; // 🔹 ESTO ES LO QUE FALTA

export interface Leccion {
  idLeccion: number;
  idSeccion: number;
  nombreLeccion: string;
  duracion: number;
  ordenLeccion: number;
  estado: number;
  urlVideo: string;
  materiales: Material[]; 
}