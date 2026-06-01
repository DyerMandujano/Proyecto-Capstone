export interface LoginResponse {
  username: string;
  rol: string;
  nombreCompleto: string;
  token: string;
  idUsuario: number;
  idPersona: number;
  idRolEspecifico: number | null; // 'Integer' en Java puede ser nulo
}