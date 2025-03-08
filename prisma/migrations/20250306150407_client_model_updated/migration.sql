/*
  Warnings:

  - Added the required column `age` to the `Client` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `client` ADD COLUMN `age` INTEGER NOT NULL,
    MODIFY `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3);
