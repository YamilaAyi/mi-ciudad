import * as SQLite from 'expo-sqlite';

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
  await base.runAsync('INSERT OR REPLACE INTO cache (clave, valor) VALUES (?, ?)', [clave, valor]);
}

export async function leerCache(clave: string): Promise<string | null> {
  const base = await abrirBase();
  const fila = await base.getFirstAsync<{ valor: string }>(
    'SELECT valor FROM cache WHERE clave = ?',
    [clave]
  );
  return fila?.valor ?? null;
}
export async function borrarCache(clave: string): Promise<void> {
  const base = await abrirBase();
  await base.runAsync('DELETE FROM cache WHERE clave = ?', [clave]);
}