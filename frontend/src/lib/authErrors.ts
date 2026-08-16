/**
 * Traduce un fallo de axios en algo que el formulario pueda mostrar.
 */
export function parseAuthError(err: unknown): string {
  if (err && typeof err === 'object') {
    const axiosErr = err as {
      code?: string;
      message?: string;
      response?: { status?: number; data?: { error?: string; hint?: string } };
    };

    if (!axiosErr.response) {
      if (axiosErr.code === 'ECONNABORTED') {
        return 'El servidor tardó demasiado en responder. Verifica que el backend esté corriendo (npm run dev).';
      }
      return 'No se pudo conectar con el servidor. Ejecuta "npm run dev" en la raíz del proyecto.';
    }

    const data = axiosErr.response.data;
    if (data?.error) {
      return data.hint ? `${data.error}. ${data.hint}` : data.error;
    }

    if (axiosErr.response.status === 503) {
      return 'Base de datos no disponible. Revisa DATABASE_URL en backend/.env';
    }
  }
  return 'Error inesperado. Intenta de nuevo.';
}
