-- AlterTable
CREATE SEQUENCE file_fileid_seq;
ALTER TABLE "File" ALTER COLUMN "fileId" SET DEFAULT nextval('file_fileid_seq');
ALTER SEQUENCE file_fileid_seq OWNED BY "File"."fileId";
