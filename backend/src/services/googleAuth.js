import { createPublicKey } from 'crypto';
import jwt from 'jsonwebtoken';

const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

export class GoogleAuthError extends Error {
  constructor(message, status = 401) {
    super(message);
    this.name = 'GoogleAuthError';
    this.status = status;
  }
}

export function isGoogleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID);
}

export function googleClientId() {
  return process.env.GOOGLE_CLIENT_ID || null;
}

// Las claves de Google rotan cada pocas horas. Se cachean respetando el
// max-age de la respuesta para no pedir el JWKS en cada inicio de sesión.
let cache = { keys: null, expiresAt: 0 };

async function fetchKeys() {
  if (cache.keys && Date.now() < cache.expiresAt) return cache.keys;

  const res = await fetch(JWKS_URL);
  if (!res.ok) {
    throw new GoogleAuthError('No se pudieron obtener las claves de Google', 502);
  }

  const { keys } = await res.json();
  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get('cache-control') ?? '')?.[1]);
  cache = {
    keys,
    expiresAt: Date.now() + (Number.isFinite(maxAge) && maxAge > 0 ? maxAge : 3600) * 1000,
  };
  return keys;
}

async function publicKeyFor(kid) {
  let keys = await fetchKeys();
  let jwk = keys.find((k) => k.kid === kid);

  // Un kid desconocido suele significar que Google rotó y tenemos caché vieja.
  if (!jwk) {
    cache = { keys: null, expiresAt: 0 };
    keys = await fetchKeys();
    jwk = keys.find((k) => k.kid === kid);
  }

  if (!jwk) throw new GoogleAuthError('El token no coincide con ninguna clave de Google');
  return createPublicKey({ key: jwk, format: 'jwk' });
}

/**
 * Valida el ID token que devuelve Google Identity Services y extrae el perfil.
 * Comprueba la firma contra las claves públicas de Google, que el token esté
 * emitido para esta aplicación y que Google haya confirmado el correo.
 */
export async function verifyGoogleToken(credential) {
  if (!isGoogleConfigured()) {
    throw new GoogleAuthError('GOOGLE_CLIENT_ID no configurada en el servidor', 503);
  }
  if (!credential || typeof credential !== 'string') {
    throw new GoogleAuthError('Falta el token de Google', 400);
  }

  const decoded = jwt.decode(credential, { complete: true });
  if (!decoded?.header?.kid) {
    throw new GoogleAuthError('El token de Google no es válido');
  }

  let payload;
  try {
    payload = jwt.verify(credential, await publicKeyFor(decoded.header.kid), {
      algorithms: ['RS256'],
      audience: process.env.GOOGLE_CLIENT_ID,
      issuer: ISSUERS,
    });
  } catch (err) {
    if (err instanceof GoogleAuthError) throw err;
    throw new GoogleAuthError(`El token de Google no es válido: ${err.message}`);
  }

  if (!payload.email) {
    throw new GoogleAuthError('Google no devolvió ningún correo');
  }
  // email_verified viene como booleano o como la cadena "true" según el flujo.
  if (payload.email_verified !== true && payload.email_verified !== 'true') {
    throw new GoogleAuthError('Google no ha verificado ese correo', 403);
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name || payload.given_name || null,
    picture: payload.picture || null,
  };
}
