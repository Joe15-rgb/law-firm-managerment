import type { Sex, User, UserRole } from '@prisma/client';
import { serializePassword } from '@tools/helpers';
import { generateAvatar } from '@tools/avatarGenerator';
import { PrismaClient } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ErrorWithStatus } from '@tools/errors';

export const prisma = new PrismaClient();

export async function UserSeeds() {
   try {
      console.info('Seeding database...');
      const users: Partial<Omit<User, 'id' | 'joinedAt' | 'updatedAt'>>[] = [
         {
            firstName: 'Harvey',
            lastName: 'Speyter',
            email: 'harveyseyter@gmail.com',
            passwordHash: serializePassword('123456'),
            avatarUrl: generateAvatar('Harvey'),
            role: 'ADMIN',
            sex: 'MALE',
            phone: '(+243) 85 86 36 262',
         },
         {
            firstName: 'Doe',
            lastName: 'Jane',
            email: 'jannedoe@gmail.com',
            passwordHash: serializePassword('123456'),
            avatarUrl: generateAvatar('janne_doe'),
            role: 'LAWYER',
            sex: 'FEMALE',
            phone: '(+243) 86 56 22 405',
         },
         {
            firstName: 'Cross',
            lastName: 'Mike',
            email: 'mikecross@gmail.com',
            passwordHash: serializePassword('123456'),
            avatarUrl: generateAvatar('mike_cross'),
            role: 'PARALEGAL',
            sex: 'MALE',
            phone: '(+243) 85 33 44 507',
         },
      ];
      await prisma.user.deleteMany(),
         await Promise.all(
            users.map((user) => prisma.user.create({ data: user as User }))
         );

      console.log('Seeds executed successfully.');
   } catch (error) {
      console.error('Error executing seeds:', error);
      if (
         error instanceof PrismaClientKnownRequestError &&
         error.code === 'P2002'
      ) {
         throw new ErrorWithStatus(
            'Un utilisateur existe déjà avec cet email',
            400
         );
      }
   } finally {
      await prisma.$disconnect();
   }
}
