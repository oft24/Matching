-- Idempotente a propósito: el despliegue la ejecuta en cada build, así que
-- volver a pasarla no debe tener efecto.

-- Crear la columna CON default deja verificadas de una vez las cuentas que ya
-- existían — se registraron antes de que hubiera código y bloquearlas dejaría
-- fuera a sus dueños. Al quitar el default acto seguido, las cuentas nuevas
-- nacen sin verificar. Si la columna ya existe no se hace nada, de modo que el
-- relleno no puede repetirse ni verificar por error a quien esté pendiente.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ALTER COLUMN "emailVerified" DROP DEFAULT;

-- La clave foránea va dentro del CREATE TABLE: ADD CONSTRAINT no admite
-- IF NOT EXISTS y aquí basta con que la proteja la guarda de la tabla.
CREATE TABLE IF NOT EXISTS "VerificationCode" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "purpose" TEXT NOT NULL DEFAULT 'email_verification',
  "codeHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VerificationCode_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VerificationCode_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "VerificationCode_userId_purpose_idx" ON "VerificationCode"("userId", "purpose");
CREATE INDEX IF NOT EXISTS "VerificationCode_expiresAt_idx" ON "VerificationCode"("expiresAt");
