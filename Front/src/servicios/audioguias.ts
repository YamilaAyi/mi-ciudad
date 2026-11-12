
import { Directory, File, Paths } from "expo-file-system";

// Carpeta permanente para guardar las audioguías.
const carpetaAudios = new Directory(Paths.document, "audioguias");

// Busca una audioguía descargada sin iniciar una nueva descarga.
export function buscarAudioLocal(url: string): string | null {
  const nombreArchivo = decodeURIComponent(
    new URL(url).pathname.split("/").pop() ?? ""
  );

  if (!nombreArchivo || !carpetaAudios.exists) {
    return null;
  }

  const archivo = new File(carpetaAudios, nombreArchivo);

  if (archivo.exists && archivo.size > 0) {
    return archivo.uri;
  }

  return null;
}
// Descarga una audioguía o devuelve el archivo si ya existe.
export async function obtenerAudioLocal(url: string): Promise<string> {
  // Crear la carpeta si todavía no existe.
  if (!carpetaAudios.exists) {
    carpetaAudios.create();
  }

  // Obtener el nombre del archivo desde la URL.
  const nombreArchivo = decodeURIComponent(
    new URL(url).pathname.split("/").pop() ?? ""
  );

  if (!nombreArchivo) {
    throw new Error("No se pudo identificar el archivo de audio.");
  }

  const archivo = new File(carpetaAudios, nombreArchivo);

  // Si ya está descargado, reutilizarlo.
  if (archivo.exists && archivo.size > 0) {
    return archivo.uri;
  }

  // Descargar el MP3 en el dispositivo.
  const descargado = await File.downloadFileAsync(url, archivo);

  return descargado.uri;
}
