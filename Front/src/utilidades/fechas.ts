const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';

function fechaValida(iso: string): Date | null {
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function partesFechaArgentina(iso: string) {
  const fecha = fechaValida(iso);
  if (!fecha) return null;

  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(fecha);

  const obtener = (tipo: string) =>
    partes.find((parte) => parte.type === tipo)?.value ?? '';

  return {
    anio: obtener('year'),
    mes: obtener('month'),
    dia: obtener('day'),
  };
}

export function claveFechaArgentina(iso: string): string {
  const partes = partesFechaArgentina(iso);
  return partes ? `${partes.anio}-${partes.mes}-${partes.dia}` : 'fecha-invalida';
}

export function formatearFechaArgentina(iso: string): string {
  const fecha = fechaValida(iso);
  if (!fecha) return 'Fecha desconocida';

  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: ZONA_HORARIA,
  }).format(fecha);
}

export function formatearDiaArgentina(iso: string): string {
  const fecha = fechaValida(iso);
  if (!fecha) return '';

  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    timeZone: ZONA_HORARIA,
  }).format(fecha);
}

export function formatearDiaCortoArgentina(iso: string): string {
  const fecha = fechaValida(iso);
  if (!fecha) return '';

  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'short',
    timeZone: ZONA_HORARIA,
  }).format(fecha).replace('.', '');
}

export function formatearNumeroDiaArgentina(iso: string): string {
  const fecha = fechaValida(iso);
  if (!fecha) return '';

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    timeZone: ZONA_HORARIA,
  }).format(fecha);
}

export function formatearMesArgentina(iso: string): string {
  const fecha = fechaValida(iso);
  if (!fecha) return '';

  return new Intl.DateTimeFormat('es-AR', {
    month: 'short',
    timeZone: ZONA_HORARIA,
  }).format(fecha).replace('.', '');
}

export function formatearHoraArgentina(iso: string): string {
  const fecha = fechaValida(iso);
  if (!fecha) return '--:--';

  return new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: ZONA_HORARIA,
  }).format(fecha);
}

// Fin del día calendario argentino correspondiente a la fecha recibida.
export function finDelDiaArgentina(iso: string): Date | null {
  const partes = partesFechaArgentina(iso);
  if (!partes) return null;

  return new Date(
    `${partes.anio}-${partes.mes}-${partes.dia}T23:59:59.999-03:00`
  );
}

export function formatearFecha(iso: string): string {
  return formatearFechaArgentina(iso);
}

export function formatearFechaHora(iso: string): string {
  const fecha = fechaValida(iso);
  if (!fecha) return 'Fecha desconocida';
  return `${formatearFechaArgentina(iso)}, ${formatearHoraArgentina(iso)} hs`;
}
