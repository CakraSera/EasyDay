-- Thread.userId is a bare demo string (ADR 0002); no FK to registered users.
ALTER TABLE "threads" DROP CONSTRAINT IF EXISTS "threads_user_id_fkey";
