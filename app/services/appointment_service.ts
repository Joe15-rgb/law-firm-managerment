import { PrismaClient, type Appointment } from '@prisma/client';
import { NotFoundError } from '@tools/errors';

type OmitCreateData = Omit<Appointment, 'id'>;
type EntityType = 'legalCase' | 'user';

class AppointmentPrismaService {
   private CACHE_TTL = 600;
   private CACHE_PREFIX = 'appointment:';
   private LIST_CACHE_PREFIX = 'appointments:all:';
   private prisma: PrismaClient;

   constructor(prisma?: PrismaClient) {
      this.prisma = prisma || new PrismaClient();
   }

   async createAppointment(data: OmitCreateData) {
      try {
         await Promise.all([
           await this.verifyEntityExists(data.legalCaseId, 'legalCase'),
           await this.verifyEntityExists(data.organizerId, 'user')
         ])
         return data
      } catch (error) {}
   }

  private async verifyEntityExists(id: string, entity: EntityType) {
      let exists = false;
      switch (entity) {
         case 'legalCase':
            exists = !!(await this.prisma.legalCase.findUnique({
               where: { id },
            }));
            break;
         case 'user':
            exists = !!(await this.prisma.user.findUnique({ where: { id } }));
            break;
         default:
            throw new NotFoundError('LegalCase or user is not found');
      }
      console.log(exists);
      if (!exists) {
         throw new NotFoundError('LegalCase or user is not found');
      }
   }
}
export default AppointmentPrismaService