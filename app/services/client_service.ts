import { PrismaClient, type Client, type LegalCase } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { getCache, invalidateCacheByPrefix, setCache } from '@tools/cache';
import { ErrorWithStatus, NotFoundError } from '@tools/errors';
import { requestLogger } from '@tools/logger';

type ClientWithCases = Client & { legalCases: LegalCase[] };

type ResultData = {
   data: ClientWithCases[];
   meta: {
      total: number;
      page: number;
      totalPages: number;
      limit: number;
   };
};

export class ClientPrismaService {
   private CACHE_TTL = 600;
   private CACHE_PREFIX = 'client:';
   private LIST_CACHE_PREFIX = 'clients:all:';
   private prisma: PrismaClient;

   constructor(prisma?: PrismaClient) {
      this.prisma = prisma || new PrismaClient();
   }

   private async handleListCacheInvalidation() {
      await invalidateCacheByPrefix(this.LIST_CACHE_PREFIX);
   }

   async createClient(
      data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>
   ): Promise<Client> {
      try {
         const newClient = await this.prisma.client.create({
            data: {
               ...data,
               createdAt: undefined,
               updatedAt: undefined,
            },
         });

         requestLogger('Client created', {
            clientId: newClient.id,
            operation: 'create',
         });

         await this.handleListCacheInvalidation();
         return newClient;
      } catch (error: any) {
         if (
            error instanceof PrismaClientKnownRequestError &&
            error.code === 'P2002'
         ) {
            throw new ErrorWithStatus(
               'Un client existe déjà avec cet email',
               400
            );
         }
         requestLogger('Error creating client', { error });
         throw error;
      }
   }

   async getOneClient(id: string): Promise<ClientWithCases> {
      const cacheKey = `${this.CACHE_PREFIX}${id}`;
      const cachedData = await getCache(cacheKey);

      if (cachedData) {
         const dbTimestamp = await this.prisma.client.findUnique({
            where: { id },
            select: { updatedAt: true },
         });

         if (
            dbTimestamp?.updatedAt?.toISOString() ===
            cachedData.updatedAt.toISOString()
         ) {
            return cachedData;
         }
      }

      const client = await this.prisma.client.findUnique({
         where: { id },
         include: { legalCases: true },
      });

      if (!client) {
         requestLogger('Client not found', { clientId: id });
         throw new NotFoundError('Client non trouvé');
      }

      await setCache(cacheKey, client, this.CACHE_TTL);
      return client;
   }

   async getAllClients(page = 1, limit = 10): Promise<ResultData> {
      const validatedPage = Math.max(1, page);
      const validatedLimit = Math.min(Math.max(limit, 1), 100);
      const cacheKey = `${this.LIST_CACHE_PREFIX}${validatedPage}:${validatedLimit}`;

      const cachedData = await getCache(cacheKey);

      const [clients, total] = await Promise.all([
         this.prisma.client.findMany({
            skip: (validatedPage - 1) * validatedLimit,
            take: validatedLimit,
            include: { legalCases: true },
            orderBy: { createdAt: 'desc' },
         }),
         this.prisma.client.count(),
      ]);

      const result: ResultData = {
         data: clients,
         meta: {
            total,
            page: validatedPage,
            totalPages: Math.ceil(total / validatedLimit),
            limit: validatedLimit,
         },
      };

      if (JSON.stringify(cachedData) === JSON.stringify(result)) return cachedData;

      await setCache(cacheKey, result, this.CACHE_TTL);
      return result;
   }

   async updateClient(id: string, data: Partial<Client>): Promise<Client> {
      try {
         const clientUpdated = await this.prisma.client.update({
            where: { id },
            data: {
               ...data,
               updatedAt: undefined, // Laisser Prisma gérer le timestamp
            },
         });

         requestLogger('Client updated', {
            clientId: id,
            operation: 'update',
         });

         await Promise.all([
            invalidateCacheByPrefix(`${this.CACHE_PREFIX}${id}`),
            this.handleListCacheInvalidation(),
         ]);

         return clientUpdated;
      } catch (error: any) {
         if (
            error instanceof PrismaClientKnownRequestError &&
            error.code === 'P2025'
         ) {
            requestLogger('Update failed - client not found', { clientId: id });
            throw new NotFoundError('Client non trouvé');
         }
         requestLogger('Error updating client', { error, clientId: id });
         throw error;
      }
   }

   async deleteClient(id: string): Promise<void> {
      try {
         await this.prisma.client.delete({ where: { id } });
         requestLogger('Client deleted', { clientId: id });

         await Promise.all([
            invalidateCacheByPrefix(`${this.CACHE_PREFIX}${id}`),
            this.handleListCacheInvalidation(),
         ]);
      } catch (error: any) {
         if (
            error instanceof PrismaClientKnownRequestError &&
            error.code === 'P2025'
         ) {
            requestLogger('Delete failed - client not found', { clientId: id });
            throw new NotFoundError('Client non trouvé');
         }
         requestLogger('Error deleting client', { error, clientId: id });
         throw error;
      }
   }
}
