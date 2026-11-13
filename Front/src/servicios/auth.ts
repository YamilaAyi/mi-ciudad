import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import type { Usuario } from '../tipos/entities';
import { apiRequest, ApiError } from './api';
import {
  borrarTokenRecordado,
  borrarTokenSesion,
  guardarTokenRecordado,
  guardarTokenSesion,
  obtenerTokenRecordado,
  obtenerTokenSesion,
} from './almacen-sesion';
import { borrarCache, guardarCache, leerCache } from './baseLocal';

// Maneja el ingreso y la sesión local; la contraseña nunca se guarda en el dispositivo.
interface RespuestaUno<T> {
  datos: T;
  meta: null;
}

interface Sesion {
  token: string;
  usuario: Usuario;
}

function esErrorDeConexion(error: unknown): boolean {
  return (
    (error instanceof ApiError && error.codigo === 'SIN_CONEXION') ||
    (error instanceof Error &&
      error.message.startsWith('No se pudo conectar con la API'))
  );
}

function esUsuarioCacheado(valor: unknown): valor is Usuario {
  if (typeof valor !== 'object' || valor === null) return false;
  return (
    'id' in valor &&
    typeof valor.id === 'string' &&
    'nombre' in valor &&
    typeof valor.nombre === 'string' &&
    'email' in valor &&
    typeof valor.email === 'string' &&
    'preferencias' in valor &&
    typeof valor.preferencias === 'object' &&
    valor.preferencias !== null
  );
}

async function guardarUsuarioCache(usuario: Usuario): Promise<void> {
  await guardarCache('usuarioId', usuario.id);
  await guardarCache('usuarioPerfil', JSON.stringify(usuario));
}

export async function ingresar(email: string, contrasena: string): Promise<Usuario> {
  const respuesta = await apiRequest<RespuestaUno<Sesion>>('/auth/ingreso', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim(), contrasena }),
  });

  if (!respuesta) {
    throw new Error('La API no devolvió los datos de la sesión.');
  }

  // Un ingreso con contraseña reemplaza cualquier token que hubiera quedado para biometría.
  await borrarTokenRecordado();
  await guardarTokenSesion(respuesta.datos.token);
  await guardarUsuarioCache(respuesta.datos.usuario);
  return respuesta.datos.usuario;
}

export async function obtenerEstadoBiometrico(): Promise<{
  sesionGuardada: boolean;
  disponible: boolean;
}> {
  const tokenActivo = await obtenerTokenSesion();
  const tokenRecordado = await obtenerTokenRecordado();
  const sesionGuardada = Boolean(tokenActivo || tokenRecordado);
  if (!sesionGuardada || Platform.OS === 'web') {
    return { sesionGuardada, disponible: false };
  }

  const tieneHardware = await LocalAuthentication.hasHardwareAsync();
  const estaRegistrada = tieneHardware && (await LocalAuthentication.isEnrolledAsync());
  return { sesionGuardada, disponible: estaRegistrada };
}

export async function ingresarConBiometria(): Promise<Usuario> {
  const estado = await obtenerEstadoBiometrico();
  if (!estado.disponible) {
    throw new Error('La biometría no está configurada en este dispositivo. Ingresá con email y contraseña.');
  }

  const resultado = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Desbloqueá tu cuenta de Mi Ciudad',
    cancelLabel: 'Cancelar',
    fallbackLabel: 'Usar contraseña',
    disableDeviceFallback: true,
  });

  if (!resultado.success) {
    if (resultado.error === 'user_cancel' || resultado.error === 'system_cancel') {
      throw new Error('Autenticación cancelada. También podés ingresar con email y contraseña.');
    }
    throw new Error('No se pudo validar la biometría. Intentá nuevamente o ingresá con email y contraseña.');
  }

  // Tras validar la identidad, se restaura el token recordado para recuperar la sesión.
  if (!(await obtenerTokenSesion())) {
    const tokenRecordado = await obtenerTokenRecordado();
    if (!tokenRecordado) {
      throw new Error('La sesión guardada venció. Ingresá con email y contraseña.');
    }
    await guardarTokenSesion(tokenRecordado);
    await borrarTokenRecordado();
  }

  const usuario = await obtenerUsuarioActual();
  if (!usuario) {
    throw new Error('La sesión guardada venció. Ingresá con email y contraseña.');
  }
  await guardarCache('usuarioId', usuario.id);
  return usuario;
}

export async function registrar(
  nombre: string,
  email: string,
  contrasena: string
): Promise<Usuario> {
  const respuesta = await apiRequest<RespuestaUno<Sesion>>('/auth/registro', {
    method: 'POST',
    body: JSON.stringify({ nombre: nombre.trim(), email: email.trim(), contrasena }),
  });

  if (!respuesta) {
    throw new Error('La API no devolvió los datos de la sesión.');
  }

  await borrarTokenRecordado();
  await guardarTokenSesion(respuesta.datos.token);
  await guardarUsuarioCache(respuesta.datos.usuario);
  return respuesta.datos.usuario;
}

export async function obtenerUsuarioActual(): Promise<Usuario | null> {
  if (!(await obtenerTokenSesion())) {
    return null;
  }

  try {
    const respuesta = await apiRequest<RespuestaUno<Usuario>>('/yo');
    if (!respuesta) {
      throw new Error('La API no devolvió los datos del usuario.');
    }
    await guardarUsuarioCache(respuesta.datos);
    return respuesta.datos;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await borrarTokenSesion();
      await borrarCache('usuarioId');
      return null;
    }
    if (esErrorDeConexion(error)) {
      const usuarioGuardado = await leerCache('usuarioPerfil');
      if (usuarioGuardado) {
        let usuario: unknown;
        try {
          usuario = JSON.parse(usuarioGuardado);
        } catch {
          throw new Error('El perfil guardado en el teléfono está dañado.');
        }
        if (!esUsuarioCacheado(usuario)) {
          throw new Error('El perfil guardado en el teléfono no tiene un formato válido.');
        }
        return usuario;
      }
    }
    throw error;
  }
}

export async function cerrarSesion(): Promise<void> {
  const token = await obtenerTokenSesion();
  const puedeUsarBiometria =
    Platform.OS !== 'web' &&
    (await LocalAuthentication.hasHardwareAsync()) &&
    (await LocalAuthentication.isEnrolledAsync());

  // Se conserva solo el token seguro para el próximo ingreso biométrico, no la contraseña.
  if (token && puedeUsarBiometria) {
    await guardarTokenRecordado(token);
  } else {
    await borrarTokenRecordado();
  }

  await borrarTokenSesion();
  await borrarCache('usuarioId');
  await borrarCache('usuarioPerfil');
}

/**
 * Lee el rol incluido en el token de sesión.
 * Se utiliza únicamente para mostrar u ocultar controles.
 * La autorización real siempre la valida la API.
 */
function decodificarPayloadJWT(valor: string): string | null {
  const alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const base64 = valor.replace(/-/g, '+').replace(/_/g, '/');
  let salida = '';
  let acumulador = 0;
  let bits = 0;

  for (const caracter of base64) {
    if (caracter === '=') break;
    const indice = alfabeto.indexOf(caracter);
    if (indice < 0) return null;
    acumulador = (acumulador << 6) | indice;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      salida += String.fromCharCode((acumulador >> bits) & 255);
    }
  }
  return salida;
}

export async function obtenerRolSesion(): Promise<'admin' | 'turista' | null> {
  const token = await obtenerTokenSesion();
  if (!token) return null;

  try {
    const segmento = token.split('.')[1];
    if (!segmento) return null;
    const contenido = decodificarPayloadJWT(segmento);
    if (!contenido) return null;

    const payload = JSON.parse(contenido) as { rol?: unknown };
    const rol = payload.rol === 'admin' || payload.rol === 'turista'
      ? payload.rol
      : null;

    console.log('[Mi Ciudad] Rol detectado:', rol);
    return rol;
  } catch (error) {
    console.log('[Mi Ciudad] Error leyendo el rol:', error);
    return null;
  }
}
