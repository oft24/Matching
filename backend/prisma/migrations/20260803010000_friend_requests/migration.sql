ALTER TABLE "Friendship" ADD COLUMN "requestedById" TEXT;
ALTER TABLE "Friendship" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "Friendship" ADD COLUMN "acceptedAt" TIMESTAMP(3);

UPDATE "Friendship"
SET "requestedById" = "userId", "status" = 'accepted', "acceptedAt" = "createdAt";

ALTER TABLE "Friendship" ALTER COLUMN "requestedById" SET NOT NULL;
CREATE INDEX "Friendship_status_idx" ON "Friendship"("status");
