export type LugarMapa = {
  id: number;
  nombre: string;
  categoria: string;
  latitud: number;
  longitud: number;
};

export const lugaresMapa: LugarMapa[] = [
  {
    id: 1,
    nombre: "Molino Forclaz",
    categoria: "Museos y patrimonio",
    latitud: -32.0,
    longitud: -58.0,
  },
  {
    id: 2,
    nombre: "Termas de Colón",
    categoria: "Termas y bienestar",
    latitud: -32.1,
    longitud: -58.1,
  },
  {
    id: 3,
    nombre: "Parque Nacional El Palmar",
    categoria: "Naturaleza",
    latitud: -31.9,
    longitud: -58.2,
  },
];
