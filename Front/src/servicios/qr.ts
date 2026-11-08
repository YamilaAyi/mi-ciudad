import type { Lugar } from '../tipos/entities';
import { ErrorApi, pedir } from './cliente';
import { obtenerLugares } from './lugares';

const PREFIJO_QR = 'COLON:';

export class ErrorQr extends Error {}

interface RespuestaUna {
  datos: Lugar;
}

// Recibe el texto leído de un QR y devuelve el lugar. Si no es un QR de Mi Ciudad,
// lanza un ErrorQr con un mensaje para mostrar. Nunca deja la app colgada.
export async function lugarDeQr(texto: string): Promise<Lugar> {
  const codigo = texto.trim();

  if (!codigo.startsWith(PREFIJO_QR) || codigo.length > 100) {
    throw new ErrorQr('Ese código no es de Mi Ciudad. Probá con el cartel de otro lugar.');
  }

  // 1) Primero el catálogo guardado en el teléfono (funciona sin señal).
  try {
    const lugares = await obtenerLugares();
    const encontrado = lugares.find((l) => l.codigoQr === codigo);
    if (encontrado) {
      if (!encontrado.activo) {
        throw new ErrorQr('Ese lugar ya no está disponible en la guía.');
      }
      return encontrado;
    }
  } catch (e) {
    if (e instanceof ErrorQr) throw e;
    // sin catálogo disponible: probamos con la API
  }

  // 2) Si no estaba en el catálogo, se lo preguntamos a la API.
  try {
    const respuesta = await pedir<RespuestaUna>(`/lugares/qr/${encodeURIComponent(codigo)}`);
    return respuesta.datos;
  } catch (e) {
    if (e instanceof ErrorApi && e.codigo === 'SIN_CONEXION') {
      throw new ErrorQr('No pudimos reconocer el código sin conexión. Probá de nuevo con señal.');
    }
    if (e instanceof ErrorApi && e.codigo === 'QR_NO_RECONOCIDO') {
      throw new ErrorQr(e.message);
    }
    throw new ErrorQr('No pudimos leer ese código. Probá de nuevo.');
  }
}