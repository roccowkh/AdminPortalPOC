/*
  Warnings:

  - You are about to drop the column `picture` on the `staff` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "staff" DROP COLUMN "picture",
ADD COLUMN     "pictures" TEXT[],
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';
