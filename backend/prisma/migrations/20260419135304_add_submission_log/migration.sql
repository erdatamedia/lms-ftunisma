-- CreateTable
CREATE TABLE "SubmissionLog" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SubmissionLog" ADD CONSTRAINT "SubmissionLog_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionLog" ADD CONSTRAINT "SubmissionLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
