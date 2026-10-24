import { borrarCache, guardarCache, leerCache } from './baseLocal';
import { cargarTokenGuardado, ErrorApi, guardarToken, pedir, registrarAlVencerSesion } from './cliente';

// TEMPORAL: mientras no exista la pantalla de login, la app entra sola con la usuaria
// de demo de la API. Cuando el login esté listo, cambiar esto a false.
const USAR_USUARIO_DEMO = true;
const EMAIL_DEMO = 'lucia@mail.com';
const CONTRASENA_DEMO = 'lucia1234';

interface RespuestaIngreso {
  datos: { token: string; usuario: { id: string } };
}

let ingresando: Promise<void> | null = null;
let tieneSesion = false;

// Si la API dice que la sesión venció, olvidamos que había una.
registrarAlVencerSesion(() => {
  tieneSesion = false;
});

// ---- Para la pantalla de login ---------------------------------------------

// Ingresa con email y contraseña. Si algo falla (por ejemplo, contraseña incorrecta),
// lanza un ErrorApi con un mensaje para mostrar tal cual.
export async function iniciarSesion(email: string, contrasena: string): Promise<void> {
  const respuesta = await pedir<RespuestaIngreso>('/auth/ingreso', {
    metodo: 'POST',
    cuerpo: { email: email.trim(), contrasena },
  });
  await guardarToken(respuesta.datos.token);
  await guardarCache('usuarioId', respuesta.datos.usuario.id);
  tieneSesion = true;
}

// Cierra la sesión. Las visitas guardadas en el teléfono se conservan: vuelven a
// verse cuando la persona ingresa de nuevo.
export async function cerrarSesion(): Promise<void> {
  await guardarToken(null);
  await borrarCache('usuarioId');
  tieneSesion = false;
}

// ¿Hay una sesión iniciada? (sirve para decidir si mostrar "Ingresá a tu cuenta").
export async function haySesion(): Promise<boolean> {
  if (tieneSesion) return true;
  return (await cargarTokenGuardado()) !== null;
}

// ---- Para el resto de la app -----------------------------------------------

// Se puede llamar muchas veces. Usa la sesión guardada y, si no hay y estamos en modo
// demo, ingresa sola. Sin sesión (y sin demo) lanza NO_AUTENTICADO.
export async function asegurarSesion(): Promise<void> {
  if (tieneSesion) return;

  const guardado = await cargarTokenGuardado();
  if (guardado) {
    tieneSesion = true;
    return;
  }

  if (!USAR_USUARIO_DEMO) {
    throw new ErrorApi('NO_AUTENTICADO', 'Ingresá a tu cuenta para continuar.', 401);
  }

  if (!ingresando) {
    ingresando = iniciarSesion(EMAIL_DEMO, CONTRASENA_DEMO).finally(() => {
      ingresando = null;
    });
  }
  return ingresando;
}

// Devuelve el id del usuario. Sin conexión usa el que quedó guardado de la última vez.
// Sin sesión lanza NO_AUTENTICADO.
export async function obtenerUsuarioId(): Promise<string | null> {
  try {
    await asegurarSesion();
  } catch (e) {
    if (e instanceof ErrorApi && e.codigo === 'NO_AUTENTICADO') throw e;
    // sin conexión: seguimos con el id guardado
  }
  return leerCache('usuarioId');
}