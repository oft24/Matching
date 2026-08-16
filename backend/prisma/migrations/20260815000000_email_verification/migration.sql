-- Idempotente a propósito: el despliegue la ejecuta en cada build, así que
-- volver a pasarla no debe tener efecto.

-- Crear la columna CON default deja verificadas de una vez las cuentas que ya
-- existían; al quitar el default acto seguido, las nuevas nacen sin marcar.
-- Si la columna ya existe no se hace nada, de modo que el relleno no puede
-- repetirse. Con Google el correo lo verifica el proveedor, pero la columna
-- se conserva porque registra cuándo se confirmó cada cuenta.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ALTER COLUMN "emailVerified" DROP DEFAULT;
