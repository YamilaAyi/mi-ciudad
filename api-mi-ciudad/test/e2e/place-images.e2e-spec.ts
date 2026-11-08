import { crearApp, type AppDePrueba } from '../utilities/create-app.js';
import { esperarError } from '../utilities/contract.js';
import {
  claveDe,
  conSesion,
  crearAdmin,
  crearLugar,
  registrarTurista,
  subirArchivo,
} from '../utilities/builders.js';

describe('D10 — PATCH /lugares/:id/imagenes', () => {
  let ctx: AppDePrueba;
  beforeEach(async () => {
    ctx = await crearApp();
  });
  afterEach(() => ctx.cerrar());

  it('admin reemplaza todas las fotos y la modificación aparece en la sincronización incremental', async () => {
    const { token } = await crearAdmin(ctx);
    const original = await subirArchivo(ctx, token);
    const id = await crearLugar(ctx, { imagenes: [claveDe(original)] });
    const nuevo = await subirArchivo(ctx, token);

    const res = await ctx
      .http()
      .patch(`/lugares/${id}/imagenes`)
      .set(conSesion(token))
      .send({ imagenes: [nuevo] })
      .expect(200);

    expect(res.body.meta).toBeNull();
    expect(res.body.datos.id).toBe(id);
    expect(res.body.datos.imagenes).toEqual([nuevo]);
    expect(new Date(res.body.datos.actualizadoEn).getTime()).toBeGreaterThan(
      new Date('2026-11-14T12:00:00-03:00').getTime(),
    );

    const novedades = await ctx.http().get('/lugares?actualizadoDesde=2026-11-14T12:00:00-03:00').expect(200);
    expect(novedades.body.datos.map((lugar: { id: string }) => lugar.id)).toContain(id);
  });

  it('admin puede quitar todas las fotos con una lista vacía', async () => {
    const { token } = await crearAdmin(ctx);
    const foto = await subirArchivo(ctx, token);
    const id = await crearLugar(ctx, { imagenes: [claveDe(foto)] });

    const res = await ctx
      .http()
      .patch(`/lugares/${id}/imagenes`)
      .set(conSesion(token))
      .send({ imagenes: [] })
      .expect(200);

    expect(res.body.datos.imagenes).toEqual([]);
  });

  it('rechaza pedidos sin sesión y cuentas turista', async () => {
    const id = await crearLugar(ctx);
    esperarError(
      await ctx.http().patch(`/lugares/${id}/imagenes`).send({ imagenes: [] }),
      401,
      'NO_AUTENTICADO',
    );

    const { token } = await registrarTurista(ctx);
    esperarError(
      await ctx.http().patch(`/lugares/${id}/imagenes`).set(conSesion(token)).send({ imagenes: [] }),
      403,
      'SIN_PERMISO',
    );
  });

  it('rechaza URLs no subidas sin alterar la lista existente', async () => {
    const { token } = await crearAdmin(ctx);
    const foto = await subirArchivo(ctx, token);
    const id = await crearLugar(ctx, { imagenes: [claveDe(foto)] });

    esperarError(
      await ctx
        .http()
        .patch(`/lugares/${id}/imagenes`)
        .set(conSesion(token))
        .send({ imagenes: [foto, 'https://otro-sitio.test/foto.jpg'] }),
      422,
      'ARCHIVO_NO_SUBIDO',
    );
    const detalle = await ctx.http().get(`/lugares/${id}`).expect(200);
    expect(detalle.body.datos.imagenes).toEqual([foto]);
  });

  it('responde 404 si el lugar no existe y valida la forma del cuerpo', async () => {
    const { token } = await crearAdmin(ctx);
    esperarError(
      await ctx.http().patch('/lugares/lug-noexiste12/imagenes').set(conSesion(token)).send({ imagenes: [] }),
      404,
      'LUGAR_NO_ENCONTRADO',
    );
    esperarError(
      await ctx
        .http()
        .patch(`/lugares/${await crearLugar(ctx)}/imagenes`)
        .set(conSesion(token))
        .send({ imagenes: 'no es una lista' }),
      400,
      'VALIDACION_FALLIDA',
    );
    esperarError(
      await ctx
        .http()
        .patch(`/lugares/${await crearLugar(ctx)}/imagenes`)
        .set(conSesion(token))
        .send({ imagenes: Array.from({ length: 21 }, () => 'imagen') }),
      400,
      'VALIDACION_FALLIDA',
    );
  });
});
