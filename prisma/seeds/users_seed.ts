import type { Sex, User, UserRole } from "@prisma/client"
import { serializePassword } from "@tools/helpers"
import { generateAvatar } from "@tools/jdenticon"
import { PrismaClient } from "@prisma/client"

export const prisma = new PrismaClient()

export async function UserSeeds() {
  try {
    console.info('Seeding database...')
    const users = [
      {
        firstName: "Harvey",
        lastName: "Speyter",
        email: "harveyseyter@admin.media",
        password: serializePassword('123456'),
        thumbnail: generateAvatar("Harvey"),
        role: 'ADMINISTRATIVE',
        sex: 'MALE',
        phone: '(+243) 85 86 36 262',
        address: "kinshasa",
      }
    ]

    await Promise.all(users.map((user) => prisma.user.create({ data: user as User })))

    console.log('Seeds executed successfully.');

  } catch (error) {
    console.error('Error executing seeds:', error);
  } finally {
    await prisma.$disconnect();
  }
}