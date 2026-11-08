export interface Coordenadas {
  latitud: number;
  longitud: number;
}

export interface Lugar {
  id: string;
  nombre: string;
  categoriaId: string;
  descripcionCorta: string;
  descripcion: string;
  coordenadas: Coordenadas;
  direccion: string;
  imagenes: string[];
  horarios: {
    dia: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    abre: string;
    cierra: string;
  }[];
  telefono: string | null;
  sitioWeb: string | null;
  precioEntrada: number | null;
  accesible: boolean;
  audioguia: {
    url: string;
    duracionSegundos: number;
    idioma: "es" | "en" | "pt";
  } | null;

  codigoQr: string | null;
  activo: boolean;
  actualizadoEn: string;
}


export interface Categoria {
  id: string;
  nombre: string;
  icono: string;
  color: string;
  orden: number;
}


export type EstadoEvento =
  | 'programado'
  | 'cancelado'
  | 'suspendido'
  | 'finalizado';

export interface Evento {
  id: string;
  titulo: string;
  descripcion: string;
  lugarId: string | null;
  direccionLibre: string | null;
  coordenadas: Coordenadas | null;
  inicio: string;
  fin: string | null;
  imagenUrl: string | null;
  precio: number | null;
  estado: EstadoEvento;
}

export interface Preferencias {
  categoriasFavoritas: string[];
  avisarProximidad: boolean;
  radioAvisoMetros: number;
  tema: "claro" | "oscuro" | "sistema";
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  avatarUrl: string | null;
  creadoEn: string;
  preferencias: Preferencias;
}

export interface Favorito {
  id: string;
  usuarioId: string;
  lugarId: string;
  creadoEn: string;
}

export type OrigenVisita = "qr" | "gps" | "manual";

export interface Visita {
  id: string;
  usuarioId: string;
  lugarId: string;
  fechaHora: string;
  origen: OrigenVisita;
  fotoUri: string | null;
  nota: string | null;
  sincronizada: boolean;
}