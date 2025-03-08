-- CreateTable
CREATE TABLE `Client` (
    `id` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(40) NOT NULL,
    `lastName` VARCHAR(40) NOT NULL,
    `email` VARCHAR(50) NOT NULL,
    `phone` CHAR(20) NOT NULL,
    `address` VARCHAR(191) NULL,
    `sex` ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    `clientType` ENUM('INDIVIDUAL', 'COMPANY') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Case` (
    `id` VARCHAR(191) NOT NULL,
    `reference` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `point` INTEGER NOT NULL,
    `urgency` ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL DEFAULT 'LOW',
    `status` ENUM('PENDING', 'OPEN', 'CLOSED', 'ARCHIVED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Case_reference_key`(`reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Treatment` (
    `id` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'OPEN', 'CLOSED', 'ARCHIVED') NOT NULL DEFAULT 'PENDING',
    `clientId` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `actorType` ENUM('USER', 'TEAM') NULL,

    UNIQUE INDEX `Treatment_clientId_userId_caseId_actorType_key`(`clientId`, `userId`, `caseId`, `actorType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(40) NOT NULL,
    `lastName` VARCHAR(40) NOT NULL,
    `email` VARCHAR(50) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `phone` CHAR(20) NOT NULL,
    `address` VARCHAR(191) NULL,
    `thumbnail` VARCHAR(191) NULL,
    `role` ENUM('LAWYER', 'PARALEGAL', 'ADMINISTRATIVE') NOT NULL,
    `sex` ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Document` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `filePath` VARCHAR(191) NOT NULL,
    `documentType` ENUM('CONTRACT', 'EVIDENCE', 'LETTER', 'OTHER') NOT NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Appointment` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `dateTime` DATETIME(3) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `status` ENUM('SCHEDULED', 'COMPLETED', 'CANCELED') NOT NULL DEFAULT 'SCHEDULED',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Group` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GroupUser` (
    `groupId` VARCHAR(191) NOT NULL,
    `userid` VARCHAR(191) NOT NULL,
    `role` ENUM('LEADER', 'MEMBER') NOT NULL,

    UNIQUE INDEX `GroupUser_groupId_userid_key`(`groupId`, `userid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Fee` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `paymentStatus` ENUM('PENDING', 'PAID', 'CANCELED') NOT NULL DEFAULT 'PENDING',
    `billedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `casbin_rule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ptype` VARCHAR(191) NOT NULL,
    `v0` VARCHAR(191) NULL,
    `v1` VARCHAR(191) NULL,
    `v2` VARCHAR(191) NULL,
    `v3` VARCHAR(191) NULL,
    `v4` VARCHAR(191) NULL,
    `v5` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Case` ADD CONSTRAINT `Case_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Document` ADD CONSTRAINT `Document_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `Case`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Appointment` ADD CONSTRAINT `Appointment_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `Case`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Appointment` ADD CONSTRAINT `Appointment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupUser` ADD CONSTRAINT `GroupUser_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupUser` ADD CONSTRAINT `GroupUser_userid_fkey` FOREIGN KEY (`userid`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Fee` ADD CONSTRAINT `Fee_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `Case`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
