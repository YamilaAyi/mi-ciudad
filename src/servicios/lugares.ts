import type { Lugar } from "../tipos/entities";
import { apiRequest } from "./api";
import { guardarCache, leerCache } from "./baseLocal";

export let usandoCacheLugares = false;

type RespuestaLugares = {
  datos: Lugar[];
  meta: {
    total: number;
    pagina: number;
    porPagina: number;
  } | null;
};

export async function obtenerLugares(): Promise<Lugar[]> {
  try {
    const respuesta = await apiRequest<RespuestaLugares>(
      "/lugares?porPagina=100"
    );

    const lugares = respuesta?.datos ?? [];

    await guardarCache("lugares", JSON.stringify(lugares));

    usandoCacheLugares = false;

    return lugares;

  } catch (error) {
    const datosGuardados = await leerCache("lugares");

    if (datosGuardados !== null) {
          usandoCacheLugares = true;
      return JSON.parse(datosGuardados) as Lugar[];
    }

    throw error;
  }
}