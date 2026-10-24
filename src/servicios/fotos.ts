import { Directory, File, Paths } from 'expo-file-system';
import { URL_API } from '../config/api';
import { ErrorApi, fetchConTiempoLimite, obtenerToken } from './cliente';

// Copia la foto a una carpeta permanente de la app y devuelve su nueva dirección.
// Si algo falla, usa la foto original en vez de perderla.
export async function guardarFotoLocal(uriOrigen: string): Promise<string> {
  try {
    const carpeta = new Directory(Paths.document, 'visitas');
    if (!carpeta.exists) carpeta.create();
    const destino = new File(carpeta, `foto-${Date.now()}.jpg`);
    new File(uriOrigen).copy(destino);
    return destino.uri;
  } catch (e) {
    console.log('No se pudo copiar la foto, se usa la original:', e);
    return uriOrigen;
  }
}

// Sube una foto a la API y devuelve su dirección pública (https://...).
// Si no hay conexión o tarda demasiado, lanza un ErrorApi SIN_CONEXION.
export async function subirFoto(uriLocal: string): Promise<string> {
  const formulario = new FormData();
  // En React Native, un archivo del teléfono se manda así:
  formulario.append('archivo', {
    uri: uriLocal,
    name: 'foto.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);

  const token = obtenerToken();
  const respuesta = await fetchConTiempoLimite(
    `${URL_API}/archivos`,
    {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formulario,
    },
    30000 // una foto tarda más que un pedido normal
  );

  const contenido = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw new ErrorApi(
      contenido?.error?.codigo ?? 'ERROR_DESCONOCIDO',
      contenido?.error?.mensaje ?? 'No pudimos subir la foto.',
      respuesta.status
    );
  }
  return contenido.datos.url as string;
}