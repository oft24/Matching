-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE IF NOT EXISTS "UserConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "riotGameName" TEXT,
    "riotTagLine" TEXT,
    "riotRegion" TEXT,
    "riotPuuid" TEXT,
    "discordUsername" TEXT,
    "discordUserId" TEXT,
    "accessToken" TEXT,
    "metadata" JSONB,
    "connected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "QueueEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'searching',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QueueEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "LiveMatch" (
    "id" TEXT NOT NULL,
    "player1Id" TEXT NOT NULL,
    "player2Id" TEXT NOT NULL,
    "player1Accepted" BOOLEAN NOT NULL DEFAULT false,
    "player2Accepted" BOOLEAN NOT NULL DEFAULT false,
    "player1Rejected" BOOLEAN NOT NULL DEFAULT false,
    "player2Rejected" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "game" TEXT NOT NULL,
    "filters" JSONB,
    "discordInviteUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "UserConnection_userId_provider_key" ON "UserConnection"("userId", "provider");
CREATE UNIQUE INDEX IF NOT EXISTS "QueueEntry_userId_key" ON "QueueEntry"("userId");
CREATE INDEX IF NOT EXISTS "LiveMatch_player1Id_idx" ON "LiveMatch"("player1Id");
CREATE INDEX IF NOT EXISTS "LiveMatch_player2Id_idx" ON "LiveMatch"("player2Id");
CREATE INDEX IF NOT EXISTS "LiveMatch_status_idx" ON "LiveMatch"("status");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "UserConnection" ADD CONSTRAINT "UserConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "QueueEntry" ADD CONSTRAINT "QueueEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
