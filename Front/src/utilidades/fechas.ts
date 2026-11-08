function aFecha(iso: string): Date | null {
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

// "14 de noviembre de 2026"
export function formatearFecha(iso: string): string {
  const fecha = aFecha(iso);
  if (!fecha) return 'Fecha desconocida';
  return fecha.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// "14 de noviembre de 2026, 16:42 hs"
export function formatearFechaHora(iso: string): string {
  const fecha = aFecha(iso);
  if (!fecha) return 'Fecha desconocida';
  const hora = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  return `${formatearFecha(iso)}, ${hora} hs`;
}