import { guardarCache, leerCache } from './baseLocal';
import { ErrorApi, pedir } from './cliente';
import { obtenerTokenSesion } from './almacen-sesion';

interface RespuestaUsuario {
  datos: { id: string };
}

export async function asegurarSesion(): Promise<void> {
  if (!(await obtenerTokenSesion())) {
    throw new ErrorApi('NO_AUTENTICADO', 'Ingresá a tu cuenta para continuar.', 401);
  }
}

// Devuelve el id del usuario. Sin conexión usa el que quedó guardado de la última vez.
// Sin sesión lanza NO_AUTENTICADO.
export async function obtenerUsuarioId(): Promise<string | null> {
  try {
    await asegurarSesion();
    const usuarioIdGuardado = await leerCache('usuarioId');
    if (usuarioIdGuardado) return usuarioIdGuardado;

    const respuesta = await pedir<RespuestaUsuario>('/yo');
    await guardarCache('usuarioId', respuesta.datos.id);
    return respuesta.datos.id;
  } catch (error) {
    if (error instanceof ErrorApi && error.codigo === 'NO_AUTENTICADO') throw error;
    if (error instanceof ErrorApi && error.codigo === 'SIN_CONEXION') {
      const usuarioIdGuardado = await leerCache('usuarioId');
      if (usuarioIdGuardado) return usuarioIdGuardado;
    }
    throw error;
  }
}