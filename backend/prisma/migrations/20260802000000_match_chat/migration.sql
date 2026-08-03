CREATE TABLE "MatchMessage" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MatchMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MatchMessage_matchId_createdAt_idx" ON "MatchMessage"("matchId", "createdAt");

ALTER TABLE "MatchMessage" ADD CONSTRAINT "MatchMessage_matchId_fkey"
  FOREIGN KEY ("matchId") REFERENCES "LiveMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatchMessage" ADD CONSTRAINT "MatchMessage_senderId_fkey"
  FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
