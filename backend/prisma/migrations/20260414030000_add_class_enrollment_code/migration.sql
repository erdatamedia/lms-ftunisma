ALTER TABLE "Class" ADD COLUMN "enrollmentCode" TEXT;

UPDATE "Class"
SET "enrollmentCode" = UPPER(SUBSTRING(MD5("id" || RANDOM()::TEXT), 1, 8))
WHERE "enrollmentCode" IS NULL;

ALTER TABLE "Class" ALTER COLUMN "enrollmentCode" SET NOT NULL;

CREATE UNIQUE INDEX "Class_enrollmentCode_key" ON "Class"("enrollmentCode");
