# q2play · servidor Discord

## Estructura

- `EMPIEZA AQUÍ`
  - `#bienvenida`: información breve de q2play, sin conversación pública.
  - `#reglas-y-seguridad`: reglas visibles y de sólo lectura.
- `MATCHES PRIVADOS`
  - El bot crea `duo-usuario-usuario` únicamente después de aceptación mutua.
  - Cada sala tiene límite de 2 personas y una invitación temporal.
  - `@everyone` no puede ver la sala.
  - Sólo las dos cuentas de Discord autorizadas pueden verla, conectarse y hablar.
  - El bot elimina la sala al finalizar el match o al vencer su TTL.

## Reglas publicadas

1. Respeto primero: cero acoso, discriminación, amenazas o contenido sexual no solicitado.
2. Invitación personal: no compartas el enlace de tu sala; pertenece sólo a las dos personas del match.
3. Privacidad: no pidas ni publiques ubicación, documentos, credenciales u otros datos sensibles.
4. Consentimiento: no grabes, retransmitas ni publiques voz o mensajes sin permiso.
5. Juego limpio: nada de trampas, venta de cuentas, fraude, spam o suplantación.
6. Sal cuando quieras: un match no crea obligación; cualquiera puede cerrar chat o voz.
7. Reporta riesgos: conserva evidencia y usa los canales oficiales ante amenazas o conducta peligrosa.
8. Sólo adultos: q2play y sus salas de match están destinados a personas de 18 años o más.

## Permisos mínimos del bot

- `Manage Channels`
- `Create Instant Invite`
- `View Channels`
- `Connect`

OAuth solicita solamente `identify` y `guilds.join`; no lee mensajes ni contactos. El flujo usa PKCE con `Public Client`, por lo que q2play no almacena un client secret.

## Variables

- `DISCORD_GUILD_ID`: servidor q2play.
- `DISCORD_CATEGORY_ID`: categoría `MATCHES PRIVADOS`.
- `DISCORD_CHANNEL_TTL_HOURS`: duración de las salas, 12 horas por defecto.
