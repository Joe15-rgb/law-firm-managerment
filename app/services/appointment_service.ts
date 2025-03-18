import { PrismaClient, type Appointment, type User, type LegalCase } from '@prisma/client';
import { NotFoundError } from '@tools/errors';

type CreateAppointmentData = Omit<Appointment, 'id'>;
type EntityType = 'legalCase' | 'user';

class AppointmentPrismaService {
  private readonly prisma: PrismaClient;
  private readonly ENTITY_ERROR_MESSAGES = {
    legalCase: 'LegalCase not found',
    user: 'User not found',
  };

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  public async createAppointment(data: CreateAppointmentData): Promise<Appointment> {
    await this.validateEntitiesExistence(data);

    return this.prisma.appointment.create({
      data,
      include: {
        legalCase: true,
        organizer: true,
      },
    });
  }
//   public async getAllAppointment(id?: string, page: number = 1, limit: number = 10): Promise<Appointment[]> {

//   }

//   public async getOneAppointment(id:string): Promise<Appointment>{

//   }

//   public async update

  private async validateEntitiesExistence(data: CreateAppointmentData): Promise<void> {
    await Promise.all([
      this.verifyEntityExists(data.legalCaseId, 'legalCase'),
      this.verifyEntityExists(data.organizerId, 'user'),
    ]);
  }

  private async verifyEntityExists(id: string, entity: EntityType): Promise<void> {
    const exists = await this.checkEntityExistence(id, entity);
    if (!exists) {
      throw new NotFoundError(this.ENTITY_ERROR_MESSAGES[entity]);
    }
  }

  private async checkEntityExistence(id: string, entity: EntityType): Promise<boolean> {
    const operations = {
      legalCase: () => this.prisma.legalCase.findUnique({ where: { id }, select: { id: true } }),
      user: () => this.prisma.user.findUnique({ where: { id }, select: { id: true } }),
    };

    const result = await operations[entity]();
    return !!result;
  }
}

export default AppointmentPrismaService;