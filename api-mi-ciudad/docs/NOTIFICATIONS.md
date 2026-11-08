# Notificaciones push

La API guarda los tokens Expo de cada cuenta y envía notificaciones mediante el servicio push de
Expo. No hace falta configurar claves de Expo para la API; sí se necesitan credenciales de
notificaciones en los builds de iOS y Android.

## Flujo implementado

- La app pide permiso y registra el token con `POST /dispositivos` al activar las notificaciones
  desde Preferencias.
- El token es único por teléfono. Si el mismo teléfono se registra con otra cuenta, queda asociado
  a la cuenta actual.
- `POST /dispositivos/prueba` envía una push a los teléfonos registrados de la sesión.
- Al cerrar sesión o desactivar las push, la app elimina su registro con
  `DELETE /dispositivos/:tokenExpo`.
- Cuando un evento guardado cambia a suspendido o cancelado, la API avisa a quienes lo guardaron.
  La app abre el detalle del evento al tocar el aviso.
- Los tokens que Expo informa como `DeviceNotRegistered` se eliminan para no volver a enviarles.
- `NOTIFICACIONES=registro` registra en la consola cuántos destinatarios habría, sin llamar a Expo.

## Configuración

La URL de Expo se configura con `EXPO_PUSH_URL` (por defecto
`https://exp.host/--/api/v2/push/send`). La API envía lotes de hasta 100 mensajes y no bloquea la
operación principal si Expo no responde; los errores quedan en el log.

Para registrar teléfonos:

1. En `AppMiCiudad`, iniciar sesión, abrir **Perfil > Preferencias** y activar **Notificaciones
   push**.
2. Para obtener el ID del proyecto, iniciar sesión con EAS y ejecutar `eas project:init`. Si no se
   incorpora a la configuración Expo, poner `EXPO_PUBLIC_EAS_PROJECT_ID` en el `.env` de la app.
3. Generar e instalar un development o preview build con EAS para el dispositivo. Expo Go no es un
   entorno válido para probar push remotas en Android.
4. Configurar las credenciales de push solicitadas por EAS: FCM v1 para Android y APNs para iOS.
   Las credenciales y la cuenta de desarrollador de Apple son necesarias para recibir push en
   dispositivos reales; no se guardan en la API.
5. En Preferencias, usar **Enviar notificación de prueba**. También se puede probar con
   `POST /dispositivos/prueba` usando un Bearer token.

Las notificaciones locales (recordatorios y cercanía) siguen funcionando aparte de las push.
