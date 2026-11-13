import * as SQLite from 'expo-sqlite';
import KVStore from 'expo-sqlite/kv-store';

let promesaBase: Promise<SQLite.SQLiteDatabase> | null = null;

// Abre la base del teléfono (la crea la primera vez). Se puede llamar muchas veces.
export function abrirBase(): Promise<SQLite.SQLiteDatabase> {
  if (!promesaBase) {
    promesaBase = (async () => {
      const base = await SQLite.openDatabaseAsync('mi-ciudad.db');
      await base.execAsync(`
        CREATE TABLE IF NOT EXISTS visitas (
          id TEXT PRIMARY KEY NOT NULL,
          usuarioId TEXT NOT NULL,
          lugarId TEXT NOT NULL,
          fechaHora TEXT NOT NULL,
          origen TEXT NOT NULL,
          fotoUri TEXT,
          nota TEXT,
          sincronizada INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS cache (
          clave TEXT PRIMARY KEY NOT NULL,
          valor TEXT NOT NULL
        );
      `);
      return base;
    })();
  }
  return promesaBase;
}

export async function guardarCache(clave: string, valor: string): Promise<void> {
  const base = await abrirBase();
  await KVStore.setItem(clave, valor);
  await base.runAsync('DELETE FROM cache WHERE clave = ?', [clave]);
}

export async function leerCache(clave: string): Promise<string | null> {
  const valor = await KVStore.getItem(clave);
  if (valor !== null) return valor;

  const base = await abrirBase();
  const fila = await base.getFirstAsync<{ valor: string }>(
    'SELECT valor FROM cache WHERE clave = ?',
    [clave]
  );
  if (!fila) return null;

  // Migra valores guardados por versiones anteriores antes de devolverlos.
  await KVStore.setItem(clave, fila.valor);
  await base.runAsync('DELETE FROM cache WHERE clave = ?', [clave]);
  return fila.valor;
}

export async function borrarCache(clave: string): Promise<void> {
  await KVStore.removeItem(clave);
  const base = await abrirBase();
  await base.runAsync('DELETE FROM cache WHERE clave = ?', [clave]);
}