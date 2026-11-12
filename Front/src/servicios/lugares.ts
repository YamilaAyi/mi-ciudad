import type { Lugar } from "../tipos/entities";
import { apiRequest } from "./api";
import { guardarCache, leerCache } from "./baseLocal";
import { URL_API } from "../config/api";

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
      "/lugares?porPagina=100",
    );

    const lugares = (respuesta?.datos ?? []).map((lugar) => ({
      ...lugar,
      audioguia: lugar.audioguia
        ? {
            ...lugar.audioguia,
            url: adaptarUrlAudio(lugar.audioguia.url),
          }
        : null,
    }));

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

export async function obtenerLugarDesdeCache(
  id: string,
): Promise<Lugar | null> {
  const datosGuardados = await leerCache("lugares");

  if (datosGuardados === null) {
    return null;
  }

  const lugares = JSON.parse(datosGuardados) as Lugar[];

  const lugar = lugares.find((lugar) => lugar.id === id);

  if (!lugar) return null;

  return {
    ...lugar,
    audioguia: lugar.audioguia
      ? {
          ...lugar.audioguia,
          url: adaptarUrlAudio(lugar.audioguia.url),
        }
      : null,
  };
}

function adaptarUrlAudio(url: string): string {
  const urlAudio = new URL(url);
  const urlApi = new URL(URL_API);

  if (urlAudio.hostname === "localhost" || urlAudio.hostname === "127.0.0.1") {
    urlAudio.host = urlApi.host;
    urlAudio.protocol = urlApi.protocol;
  }

  return urlAudio.toString();
}
