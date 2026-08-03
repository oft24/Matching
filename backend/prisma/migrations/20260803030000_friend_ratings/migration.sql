CREATE TABLE "UserRating" (
  "id" TEXT NOT NULL,
  "raterId" TEXT NOT NULL,
  "ratedId" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserRating_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserRating_score_check" CHECK ("score" >= 1 AND "score" <= 5),
  CONSTRAINT "UserRating_not_self_check" CHECK ("raterId" <> "ratedId")
);

CREATE UNIQUE INDEX "UserRating_raterId_ratedId_key" ON "UserRating"("raterId", "ratedId");
CREATE INDEX "UserRating_ratedId_idx" ON "UserRating"("ratedId");
ALTER TABLE "UserRating" ADD CONSTRAINT "UserRating_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserRating" ADD CONSTRAINT "UserRating_ratedId_fkey" FOREIGN KEY ("ratedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
