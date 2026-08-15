import type { VerificationChallenge } from '../types';

export interface ParsedAuthError {
  message: string;
  /** Presente cuando el backend pide confirmar el correo antes de continuar. */
  challenge?: VerificationChallenge;
  /** Segundos que faltan para poder pedir otro código (respuesta 429). */
  retryAfter?: number;
}

/**
 * Traduce un fallo de axios en algo que el formulario pueda mostrar, y detecta
 * si la respuesta trae un reto de verificación pendiente.
 */
export function parseAuthError(err: unknown): ParsedAuthError {
  if (err && typeof err === 'object') {
    const axiosErr = err as {
      code?: string;
      message?: string;
      response?: {
        status?: number;
        data?: { error?: string; hint?: string; retryAfter?: number } & Partial<VerificationChallenge>;
      };
    };

    if (!axiosErr.response) {
      if (axiosErr.code === 'ECONNABORTED') {
        return { message: 'El servidor tardó demasiado en responder. Verifica que el backend esté corriendo (npm run dev).' };
      }
      return { message: 'No se pudo conectar con el servidor. Ejecuta "npm run dev" en la raíz del proyecto.' };
    }

    const data = axiosErr.response.data;
    const challenge: VerificationChallenge | undefined =
      data?.requiresVerification && data.email
        ? {
            requiresVerification: true,
            email: data.email,
            emailDelivered: Boolean(data.emailDelivered),
            expiresInMinutes: data.expiresInMinutes ?? 10,
            devCode: data.devCode,
          }
        : undefined;

    if (data?.error) {
      return {
        message: data.hint ? `${data.error}. ${data.hint}` : data.error,
        challenge,
        retryAfter: data.retryAfter,
      };
    }

    if (axiosErr.response.status === 503) {
      return { message: 'Base de datos no disponible. Revisa DATABASE_URL en backend/.env' };
    }
  }
  return { message: 'Error inesperado. Intenta de nuevo.' };
}
