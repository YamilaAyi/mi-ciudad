import { Directory, File, Paths } from 'expo-file-system';
import { clienteHttp } from './cliente';

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

// Sube una foto a la API y devuelve su dirección pública.
// Los errores (incluida la falta de conexión) los traduce el cliente.
export async function subirFoto(uriLocal: string): Promise<string> {
  const formulario = new FormData();
  formulario.append('archivo', {
    uri: uriLocal,
    name: 'foto.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);

  const respuesta = await clienteHttp.post<{ datos: { url: string } }>('/archivos', formulario, {
    timeout: 30000, // una foto tarda más que un pedido normal
    headers: { 'Content-Type': 'multipart/form-data' },
    transformRequest: (datos) => datos, // que axios no intente convertir el formulario
  });
  return respuesta.data.datos.url;
}