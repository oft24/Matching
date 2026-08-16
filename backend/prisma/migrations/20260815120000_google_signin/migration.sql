-- Idempotente: se ejecuta en cada build del despliegue.

-- Se entra con Google, así que ya no hay contraseña que exigir. Las cuentas
-- antiguas conservan su hash; simplemente no queda ninguna ruta que lo mire.
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key" ON "User"("googleId");

-- Los códigos de verificación por correo desaparecen con el cambio a Google:
-- es el proveedor quien garantiza que la dirección es del usuario.
DROP TABLE IF EXISTS "VerificationCode";
