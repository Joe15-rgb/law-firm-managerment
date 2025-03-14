/*
  Warnings:

  - You are about to drop the column `caseId` on the `appointment` table. All the data in the column will be lost.
  - You are about to drop the column `dateTime` on the `appointment` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `appointment` table. All the data in the column will be lost.
  - The values [CANCELED] on the enum `Appointment_status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `address` on the `client` table. All the data in the column will be lost.
  - You are about to drop the column `age` on the `client` table. All the data in the column will be lost.
  - You are about to drop the column `caseId` on the `document` table. All the data in the column will be lost.
  - You are about to drop the column `filePath` on the `document` table. All the data in the column will be lost.
  - The values [LETTER] on the enum `Document_documentType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `caseId` on the `fee` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatus` on the `fee` table. All the data in the column will be lost.
  - You are about to drop the column `caseId` on the `treatment` table. All the data in the column will be lost.
  - You are about to drop the column `clientId` on the `treatment` table. All the data in the column will be lost.
  - The values [OPEN,CLOSED] on the enum `Treatment_status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `address` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnail` on the `user` table. All the data in the column will be lost.
  - The values [ADMINISTRATIVE] on the enum `User_role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `case` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `groupuser` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name]` on the table `Group` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[legalCaseId,userId,groupId]` on the table `Treatment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `legalCaseId` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizerId` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scheduledAt` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `birthDate` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Made the column `createdAt` on table `client` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `client` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `fileUrl` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `legalCaseId` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mimeType` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Made the column `updatedAt` on table `document` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `dueDate` to the `Fee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `legalCaseId` to the `Fee` table without a default value. This is not possible if the table is not empty.
  - Made the column `updatedAt` on table `group` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `legalCaseId` to the `Treatment` table without a default value. This is not possible if the table is not empty.
  - Made the column `actorType` on table `treatment` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `updatedAt` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `appointment` DROP FOREIGN KEY `Appointment_caseId_fkey`;

-- DropForeignKey
ALTER TABLE `appointment` DROP FOREIGN KEY `Appointment_userId_fkey`;

-- DropForeignKey
ALTER TABLE `case` DROP FOREIGN KEY `Case_clientId_fkey`;

-- DropForeignKey
ALTER TABLE `document` DROP FOREIGN KEY `Document_caseId_fkey`;

-- DropForeignKey
ALTER TABLE `fee` DROP FOREIGN KEY `Fee_caseId_fkey`;

-- DropForeignKey
ALTER TABLE `groupuser` DROP FOREIGN KEY `GroupUser_groupId_fkey`;

-- DropForeignKey
ALTER TABLE `groupuser` DROP FOREIGN KEY `GroupUser_userid_fkey`;

-- DropIndex
DROP INDEX `Appointment_caseId_fkey` ON `appointment`;

-- DropIndex
DROP INDEX `Appointment_userId_fkey` ON `appointment`;

-- DropIndex
DROP INDEX `Document_caseId_fkey` ON `document`;

-- DropIndex
DROP INDEX `Fee_caseId_fkey` ON `fee`;

-- DropIndex
DROP INDEX `Treatment_clientId_userId_caseId_actorType_key` ON `treatment`;

-- AlterTable
ALTER TABLE `appointment` DROP COLUMN `caseId`,
    DROP COLUMN `dateTime`,
    DROP COLUMN `userId`,
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `duration` INTEGER NOT NULL DEFAULT 60,
    ADD COLUMN `legalCaseId` VARCHAR(191) NOT NULL,
    ADD COLUMN `organizerId` VARCHAR(191) NOT NULL,
    ADD COLUMN `scheduledAt` DATETIME(3) NOT NULL,
    MODIFY `subject` VARCHAR(200) NOT NULL,
    MODIFY `status` ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED') NOT NULL DEFAULT 'SCHEDULED';

-- AlterTable
ALTER TABLE `client` DROP COLUMN `address`,
    DROP COLUMN `age`,
    ADD COLUMN `addressLine1` VARCHAR(255) NULL,
    ADD COLUMN `addressLine2` VARCHAR(255) NULL,
    ADD COLUMN `birthDate` DATETIME(3) NOT NULL,
    ADD COLUMN `city` VARCHAR(100) NULL,
    ADD COLUMN `country` VARCHAR(100) NULL,
    MODIFY `phone` VARCHAR(20) NOT NULL,
    MODIFY `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `document` DROP COLUMN `caseId`,
    DROP COLUMN `filePath`,
    ADD COLUMN `fileUrl` VARCHAR(191) NOT NULL,
    ADD COLUMN `legalCaseId` VARCHAR(191) NOT NULL,
    ADD COLUMN `mimeType` VARCHAR(50) NOT NULL,
    MODIFY `fileName` VARCHAR(255) NOT NULL,
    MODIFY `documentType` ENUM('CONTRACT', 'EVIDENCE', 'CORRESPONDENCE', 'COURT_FILING', 'OTHER') NOT NULL,
    MODIFY `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `fee` DROP COLUMN `caseId`,
    DROP COLUMN `paymentStatus`,
    ADD COLUMN `currency` VARCHAR(3) NOT NULL DEFAULT 'USD',
    ADD COLUMN `dueDate` DATETIME(3) NOT NULL,
    ADD COLUMN `legalCaseId` VARCHAR(191) NOT NULL,
    ADD COLUMN `paidAt` DATETIME(3) NULL,
    ADD COLUMN `status` ENUM('DRAFT', 'PENDING', 'PAID', 'PARTIALLY_PAID', 'CANCELLED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `group` ADD COLUMN `description` TEXT NULL,
    MODIFY `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `treatment` DROP COLUMN `caseId`,
    DROP COLUMN `clientId`,
    ADD COLUMN `groupId` VARCHAR(191) NULL,
    ADD COLUMN `legalCaseId` VARCHAR(191) NOT NULL,
    MODIFY `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED') NOT NULL DEFAULT 'PENDING',
    MODIFY `actorType` ENUM('USER', 'GROUP') NOT NULL;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `address`,
    DROP COLUMN `password`,
    DROP COLUMN `thumbnail`,
    ADD COLUMN `avatarUrl` VARCHAR(191) NULL,
    ADD COLUMN `passwordHash` VARCHAR(191) NOT NULL,
    MODIFY `phone` VARCHAR(20) NOT NULL,
    MODIFY `role` ENUM('LAWYER', 'PARALEGAL', 'ADMIN') NOT NULL,
    MODIFY `updatedAt` DATETIME(3) NOT NULL;

-- DropTable
DROP TABLE `case`;

-- DropTable
DROP TABLE `groupuser`;

-- CreateTable
CREATE TABLE `LegalCase` (
    `id` VARCHAR(191) NOT NULL,
    `reference` VARCHAR(191) NOT NULL,
    `caseNumber` INTEGER NULL AUTO_INCREMENT,
    `title` VARCHAR(200) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `priority` INTEGER NOT NULL DEFAULT 1,
    `urgency` ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL DEFAULT 'LOW',
    `status` ENUM('PENDING', 'OPEN', 'CLOSED', 'ARCHIVED') NOT NULL DEFAULT 'PENDING',
    `caseType` ENUM('CIVIL', 'CRIMINAL', 'COMMERCIAL', 'LABOR', 'ADMINISTRATIVE') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LegalCase_reference_key`(`reference`),
    UNIQUE INDEX `LegalCase_caseNumber_key`(`caseNumber`),
    INDEX `LegalCase_clientId_idx`(`clientId`),
    INDEX `LegalCase_status_idx`(`status`),
    INDEX `LegalCase_caseType_idx`(`caseType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GroupMember` (
    `groupId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` ENUM('LEADER', 'MEMBER') NOT NULL DEFAULT 'MEMBER',

    UNIQUE INDEX `GroupMember_groupId_userId_key`(`groupId`, `userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Appointment_scheduledAt_idx` ON `Appointment`(`scheduledAt`);

-- CreateIndex
CREATE INDEX `Appointment_status_idx` ON `Appointment`(`status`);

-- CreateIndex
CREATE INDEX `casbin_rule_ptype_idx` ON `casbin_rule`(`ptype`);

-- CreateIndex
CREATE INDEX `Client_lastName_firstName_idx` ON `Client`(`lastName`, `firstName`);

-- CreateIndex
CREATE INDEX `Client_createdAt_idx` ON `Client`(`createdAt`);

-- CreateIndex
CREATE INDEX `Document_documentType_idx` ON `Document`(`documentType`);

-- CreateIndex
CREATE INDEX `Fee_status_idx` ON `Fee`(`status`);

-- CreateIndex
CREATE INDEX `Fee_dueDate_idx` ON `Fee`(`dueDate`);

-- CreateIndex
CREATE UNIQUE INDEX `Group_name_key` ON `Group`(`name`);

-- CreateIndex
CREATE INDEX `Treatment_actorType_legalCaseId_idx` ON `Treatment`(`actorType`, `legalCaseId`);

-- CreateIndex
CREATE UNIQUE INDEX `Treatment_legalCaseId_userId_groupId_key` ON `Treatment`(`legalCaseId`, `userId`, `groupId`);

-- CreateIndex
CREATE INDEX `User_lastName_firstName_idx` ON `User`(`lastName`, `firstName`);

-- AddForeignKey
ALTER TABLE `LegalCase` ADD CONSTRAINT `LegalCase_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Treatment` ADD CONSTRAINT `Treatment_legalCaseId_fkey` FOREIGN KEY (`legalCaseId`) REFERENCES `LegalCase`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Treatment` ADD CONSTRAINT `Treatment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Treatment` ADD CONSTRAINT `Treatment_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Document` ADD CONSTRAINT `Document_legalCaseId_fkey` FOREIGN KEY (`legalCaseId`) REFERENCES `LegalCase`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Appointment` ADD CONSTRAINT `Appointment_legalCaseId_fkey` FOREIGN KEY (`legalCaseId`) REFERENCES `LegalCase`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Appointment` ADD CONSTRAINT `Appointment_organizerId_fkey` FOREIGN KEY (`organizerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupMember` ADD CONSTRAINT `GroupMember_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupMember` ADD CONSTRAINT `GroupMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Fee` ADD CONSTRAINT `Fee_legalCaseId_fkey` FOREIGN KEY (`legalCaseId`) REFERENCES `LegalCase`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
