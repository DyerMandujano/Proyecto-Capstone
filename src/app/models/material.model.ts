export interface Material {
  idMaterial?: number;
  urlMaterial?: string; // Lo dejamos opcional porque ahora usaremos un archivo
  nombreArchivo?: string;
  archivoFisico?: File; // 🔹 Nueva propiedad para guardar el archivo de la PC
}