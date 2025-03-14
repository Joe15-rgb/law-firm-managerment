import { CACHE_TTL } from '@configs/env_config';
import {
   CaseTypes,
   PrismaClient,
   type LegalCase,
   type Client,
} from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { getCache, setCache, invalidateCacheByPrefix } from '@tools/cache';
import { ErrorWithStatus, NotFoundError } from '@tools/errors';
import { requestLogger } from '@tools/logger';

type OmitCaseProperties = 'createdAt' | 'updatedAt' | 'id';
type LegalCaseCreateInput = Omit<LegalCase, OmitCaseProperties>;
type LegalCaseUpdateInput = Partial<
   Omit<LegalCase, OmitCaseProperties | 'reference'>
>;

interface ClientNames {
   first: string;
   last: string;
}

interface ReferenceGenerationParams {
   clientNames: ClientNames;
   caseType: CaseTypes;
   city: string;
   country: string;
}

interface PaginationOptions {
   page?: number;
   pageSize?: number;
}

interface PaginatedResult<T> {
   data: T[];
   meta: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
   };
}

export class LedgerPrismaService {
   private readonly DEFAULT_CACHE_TTL = CACHE_TTL;
   private readonly CASE_CACHE_PREFIX = 'legal-case:';
   private readonly LIST_CACHE_PREFIX = 'legal-cases:all';
   private prisma: PrismaClient;

   constructor(prisma: PrismaClient = new PrismaClient()) {
      this.prisma = prisma;
   }

   private async invalidateListCache(): Promise<void> {
      await invalidateCacheByPrefix(this.LIST_CACHE_PREFIX);
   }

   private validateReferenceParameters(
      params: ReferenceGenerationParams
   ): void {
      const { clientNames, caseType, city, country } = params;
      if (
         !clientNames?.first ||
         !clientNames?.last ||
         !caseType ||
         !city ||
         !country
      ) {
         throw new ErrorWithStatus(
            'Missing required parameters for reference generation',
            400
         );
      }
   }

   private generateCaseReference(params: ReferenceGenerationParams): string {
      this.validateReferenceParameters(params);

      const currentYear = new Date().getFullYear();
      const initials =
         `${params.clientNames.first[0]}${params.clientNames.last[0]}`.toUpperCase();
      // const paddedCaseNumber = params.caseNumber.toString().padStart(3, '0');

      return `${currentYear}/${initials}-${params.city}-${params.country}/${params.caseType}`;
   }

   /**
    * Creates a new legal case with generated reference
    * @param data Legal case data without auto-generated properties
    * @returns Created LegalCase entity
    * @throws {NotFoundError} When client not found
    * @throws {ErrorWithStatus} When reference conflict occurs
    */
   async createLegalCase(
      data: Omit<LegalCase, OmitCaseProperties>
   ): Promise<LegalCase> {
      try {
         const client = await this.prisma.client.findUnique({
            where: { id: data.clientId },
            select: {
               firstName: true,
               lastName: true,
               city: true,
               country: true,
            },
         });

         if (!client) {
            throw new NotFoundError('Client not found for legal case creation');
         }

         const referenceParams = {
            clientNames: {
               first: client.firstName,
               last: client.lastName,
            },
            caseType: data.caseType,
            city: client.city,
            country: client.country,
         };

         const payload: Omit<LegalCase, OmitCaseProperties> = {
            ...data,
            reference: this.generateCaseReference(
               referenceParams as ReferenceGenerationParams
            ),
         };
         console.log(payload);

         const legalCase = await this.prisma.legalCase.create({
            data: payload,
         });

         requestLogger('Legal case created successfully', {
            caseId: legalCase.id,
            clientId: legalCase.clientId,
            operation: 'create',
         });

         await this.invalidateListCache();
         return legalCase;
      } catch (error) {
         if (error instanceof PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
               throw new ErrorWithStatus(
                  'A legal case with this reference already exists',
                  409
               );
            }
            throw new ErrorWithStatus('Database operation failed', 500);
         }

         requestLogger('Error creating legal case', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
         });

         throw error instanceof ErrorWithStatus
            ? error
            : new ErrorWithStatus('Internal server error', 500);
      }
   }

   /**
    * Retrieves a legal case by ID with caching
    * @param id Legal case ID
    * @returns LegalCase entity
    * @throws {NotFoundError} When case not found
    */
   async getLegalCaseById(id: string): Promise<LegalCase> {
      const cacheKey = `${this.CASE_CACHE_PREFIX}${id}`;

      try {
         const cachedCase = await getCache(cacheKey);

         const legalCase = await this.prisma.legalCase.findUnique({
            where: { id },
            include: {
               client: true,
               documents: true,
               treatments: {
                  include: {
                     User: true,
                     Group: {
                        include: {
                           members: true,
                        },
                     },
                  },
               },
            },
         });

         if (!legalCase) {
            throw new NotFoundError(`Legal case with ID ${id} not found`);
         }
         if (JSON.stringify(cachedCase) === JSON.stringify(legalCase))
            return cachedCase;

         await setCache(cacheKey, legalCase, this.DEFAULT_CACHE_TTL);
         requestLogger('Legal case retrieved', { caseId: id });
         return legalCase;
      } catch (error) {
         requestLogger('Error retrieving legal case', {
            error: error instanceof Error ? error.message : 'Unknown error',
            caseId: id,
         });
         throw this.handleDatabaseError(error);
      }
   }

   /**
    * Updates a legal case with proper validation and cache invalidation
    * @param id Legal case ID
    * @param updateData Partial case data
    * @returns Updated LegalCase entity
    * @throws {NotFoundError} When case not found
    */
   async updateLegalCase(
      id: string,
      updateData: LegalCaseUpdateInput
   ): Promise<LegalCase> {
      try {
         const existingCase = await this.getLegalCaseById(id);

         const updatedCase = await this.prisma.legalCase.update({
            where: { id },
            data: {
               ...updateData,
               updatedAt: new Date(),
            },
         });

         await this.invalidateCacheForCase(id);
         requestLogger('Legal case updated', { caseId: id });

         return updatedCase;
      } catch (error) {
         requestLogger('Error updating legal case', {
            error: error instanceof Error ? error.message : 'Unknown error',
            caseId: id,
         });
         throw this.handleDatabaseError(error);
      }
   }

   /**
    * Deletes a legal case with related data cleanup
    * @param id Legal case ID
    * @throws {NotFoundError} When case not found
    */
   async deleteLegalCase(id: string): Promise<void> {
      try {
         await this.prisma.$transaction(async (tx) => {
            // Example of related data cleanup
            await tx.document.deleteMany({ where: { legalCaseId: id } });
            await tx.legalCase.delete({ where: { id } });
         });

         await this.invalidateCacheForCase(id);
         requestLogger('Legal case deleted', { caseId: id });
      } catch (error) {
         requestLogger('Error deleting legal case', {
            error: error instanceof Error ? error.message : 'Unknown error',
            caseId: id,
         });
         throw this.handleDatabaseError(error);
      }
   }

   /**
    * Lists legal cases with pagination and filtering
    * @param options Pagination and filtering options
    * @returns Paginated list of legal cases
    */
   async getAllLegalCases(
      options?: PaginationOptions & { caseType?: CaseTypes }
   ): Promise<PaginatedResult<LegalCase>> {
      const { page = 1, pageSize = 20, caseType } = options || {};
      const skip = (page - 1) * pageSize;
      const cacheKey = `${this.LIST_CACHE_PREFIX}:page=${page}:size=${pageSize}:type=${caseType}`;

      try {
         const cachedResult = await getCache(cacheKey);

         const [total, data] = await Promise.all([
            this.prisma.legalCase.count({ where: { caseType } }),
            this.prisma.legalCase.findMany({
               where: { caseType },
               skip,
               take: pageSize,
               orderBy: { createdAt: 'desc' },
               include: { client: true },
            }),
         ]);

         const result = {
            data,
            meta: {
               total,
               page,
               pageSize,
               totalPages: Math.ceil(total / pageSize),
            },
         };

         if (JSON.stringify(cachedResult) === JSON.stringify(result))
            return cachedResult;

         await setCache(cacheKey, result, this.DEFAULT_CACHE_TTL);

         return result;
      } catch (error) {
         requestLogger('Error retrieving legal cases', {
            error: error instanceof Error ? error.message : 'Unknown error',
         });
         throw this.handleDatabaseError(error);
      }
   }

   /**
    * Searches legal cases with multiple criteria
    * @param searchParams Search filters
    * @returns Matching legal cases
    */
   async searchLegalCases(searchParams: {
      reference?: string;
      clientName?: string;
      caseType?: CaseTypes;
      status?: string;
   }): Promise<LegalCase[]> {
      try {
         const whereClause: any = {};

         if (searchParams.reference) {
            whereClause.reference = {
               contains: searchParams.reference,
               mode: 'insensitive',
            };
         }

         if (searchParams.clientName) {
            whereClause.client = {
               OR: [
                  {
                     firstName: {
                        contains: searchParams.clientName,
                        mode: 'insensitive',
                     },
                  },
                  {
                     lastName: {
                        contains: searchParams.clientName,
                        mode: 'insensitive',
                     },
                  },
               ],
            };
         }

         if (searchParams.caseType) {
            whereClause.caseType = searchParams.caseType;
         }

         if (searchParams.status) {
            whereClause.status = searchParams.status;
         }

         return this.prisma.legalCase.findMany({
            where: whereClause,
            include: { client: true },
            take: 50,
         });
      } catch (error) {
         requestLogger('Error searching legal cases', {
            error: error instanceof Error ? error.message : 'Unknown error',
         });
         throw this.handleDatabaseError(error);
      }
   }

   private async invalidateCacheForCase(id: string): Promise<void> {
      await Promise.all([
         invalidateCacheByPrefix(`${this.CASE_CACHE_PREFIX}${id}`),
         invalidateCacheByPrefix(this.LIST_CACHE_PREFIX),
      ]);
   }

   private handleDatabaseError(error: unknown): Error {
      if (error instanceof PrismaClientKnownRequestError) {
         switch (error.code) {
            case 'P2002':
               return new ErrorWithStatus('Unique constraint violation', 409);
            case 'P2025':
               return new NotFoundError('Resource not found');
            default:
               return new ErrorWithStatus('Database operation failed', 500);
         }
      }
      return error instanceof Error
         ? error
         : new Error('Unknown database error');
   }
}

export default LedgerPrismaService;
