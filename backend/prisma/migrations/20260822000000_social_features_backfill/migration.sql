-- Backfill idempotente para instalaciones que nacieron antes de las funciones
-- sociales. El build lo puede ejecutar varias veces sin perder datos.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gender" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "termsVersion" TEXT;

CREATE TABLE IF NOT EXISTS "Friendship" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "friendId" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Friendship" ADD COLUMN IF NOT EXISTS "requestedById" TEXT;
ALTER TABLE "Friendship" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "Friendship" ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMP(3);
UPDATE "Friendship"
SET "requestedById" = "userId", "status" = 'accepted', "acceptedAt" = COALESCE("acceptedAt", "createdAt")
WHERE "requestedById" IS NULL;
ALTER TABLE "Friendship" ALTER COLUMN "requestedById" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Friendship_userId_friendId_key" ON "Friendship"("userId", "friendId");
CREATE INDEX IF NOT EXISTS "Friendship_friendId_idx" ON "Friendship"("friendId");
CREATE INDEX IF NOT EXISTS "Friendship_status_idx" ON "Friendship"("status");

DO $$ BEGIN
  ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_friendId_fkey"
    FOREIGN KEY ("friendId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "DirectMessage" (
  "id" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DirectMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DirectMessage_senderId_recipientId_createdAt_idx"
  ON "DirectMessage"("senderId", "recipientId", "createdAt");
CREATE INDEX IF NOT EXISTS "DirectMessage_recipientId_readAt_idx"
  ON "DirectMessage"("recipientId", "readAt");

DO $$ BEGIN
  ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_senderId_fkey"
    FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_recipientId_fkey"
    FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "UserRating" (
  "id" TEXT NOT NULL,
  "raterId" TEXT NOT NULL,
  "ratedId" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserRating_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserRating_raterId_ratedId_key" ON "UserRating"("raterId", "ratedId");
CREATE INDEX IF NOT EXISTS "UserRating_ratedId_idx" ON "UserRating"("ratedId");

DO $$ BEGIN
  ALTER TABLE "UserRating" ADD CONSTRAINT "UserRating_score_check" CHECK ("score" >= 1 AND "score" <= 5);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "UserRating" ADD CONSTRAINT "UserRating_not_self_check" CHECK ("raterId" <> "ratedId");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "UserRating" ADD CONSTRAINT "UserRating_raterId_fkey"
    FOREIGN KEY ("raterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "UserRating" ADD CONSTRAINT "UserRating_ratedId_fkey"
    FOREIGN KEY ("ratedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
