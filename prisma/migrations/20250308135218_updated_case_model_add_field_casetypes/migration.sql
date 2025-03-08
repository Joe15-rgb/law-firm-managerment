/*
  Warnings:

  - Added the required column `caseType` to the `Case` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `case` ADD COLUMN `caseType` ENUM('CIV', 'PEN', 'COM', 'TRA', 'ADM') NOT NULL;
