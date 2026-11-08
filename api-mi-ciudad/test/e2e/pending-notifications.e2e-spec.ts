import { conSesion, registrarTurista } from '../utilities/builders.js';
import { crearApp, type AppDePrueba } from '../utilities/create-app.js';

describe('Notificaciones push en modo registro', () => {
  let ctx: AppDePrueba;
  let token: string;

  beforeEach(async () => {
    ctx = await crearApp({ reales: true, entorno: { NOTIFICACIONES: 'registro' } });
    token = (await registrarTurista(ctx)).token;
  });
  afterEach(() => ctx.cerrar());

  it('registra el teléfono, permite probarlo y lo da de baja', async () => {
    const expoToken = 'ExponentPushToken[aaaaaaaaaaaaaaaaaaaaaa]';
    await ctx
      .http()
      .post('/dispositivos')
      .set(conSesion(token))
      .send({ tokenExpo: expoToken, plataforma: 'android' })
      .expect(201);
    const prueba = await ctx.http().post('/dispositivos/prueba').set(conSesion(token)).expect(200);
    expect(prueba.body.datos).toEqual({ enviadas: 1 });
    await ctx
      .http()
      .delete(`/dispositivos/${encodeURIComponent(expoToken)}`)
      .set(conSesion(token))
      .expect(204);
  });

  it('sin sesión sigue siendo 401', async () => {
    await ctx.http().post('/dispositivos/prueba').expect(401);
  });
});
