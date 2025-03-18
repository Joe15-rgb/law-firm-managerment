import { PrismaClient, type Document, Prisma } from '@prisma/client';
import { invalidateCacheByPrefix, setCache, getCache } from '@tools/cache';
import { requestLogger } from '@tools/logger';
import { NotFoundError, ErrorWithStatus } from '@tools/errors';
import StorageService  from '@services/storage';


type DocumentCreateData = Omit<Document, 'id' | 'uploadedAt' | 'updatedAt'>;
type DocumentUpdateData = Partial<
   Omit<Document, 'id' | 'uploadedAt' | 'legalCaseId'>
>;

type PaginationOptions = {
   page: number;
   limit: number;
};

class DocumentCasePrismaService {
   private readonly CACHE_TTL = 600;
   private readonly CACHE_PREFIX = 'document:';
   private readonly LIST_CACHE_PREFIX = 'documents:all:';
   private prisma: PrismaClient;
   private storageService: StorageService;

   constructor(prisma?: PrismaClient, storageService?: StorageService) {
      this.prisma = prisma || new PrismaClient();
      this.storageService = storageService || new StorageService();
   }

   private async handleCacheInvalidation(id?: string) {
      const invalidationPromises: Promise<void>[] = [
         invalidateCacheByPrefix(this.LIST_CACHE_PREFIX),
      ];

      if (id) {
         invalidationPromises.push(
            invalidateCacheByPrefix(`${this.CACHE_PREFIX}${id}`)
         );
      }

      await Promise.all(invalidationPromises);
   }

   private async verifyCacheConsistency(cacheKey: string, id: string) {
      const [cachedData, dbData] = await Promise.all([
         getCache(cacheKey),
         this.prisma.document.findUnique({ where: { id } }),
      ]);

      if (
         cachedData &&
         dbData &&
         JSON.stringify(cachedData) !== JSON.stringify(dbData)
      ) {
         await invalidateCacheByPrefix(cacheKey);
         return null;
      }

      return cachedData || dbData;
   }

   async createDocumentCase(data: DocumentCreateData): Promise<Document> {
      try {
         const newDocument = await this.prisma.document.create({
            data
         });

         await this.handleCacheInvalidation();
         requestLogger(`Document created - ID: ${newDocument.id}`);
         return newDocument;
      } catch (error) {
         this.handleError(error, 'Failed to create document');
      }
   }

   async getOneByIdDocumentCase(id: string): Promise<Document> {
      const cacheKey = `${this.CACHE_PREFIX}${id}`;

      try {
         const document = await this.verifyCacheConsistency(cacheKey, id);

         if (!document) {
            throw new NotFoundError('Document not found');
         }

         if (!(await getCache(cacheKey))) {
            await setCache(cacheKey, document, this.CACHE_TTL);
         }

         return document;
      } catch (error) {
         this.handleError(error, `Failed to fetch document ${id}`);
      }
   }

   async getAllDocumentCases(
      legalCaseId?: string,
      paginationOptions?: PaginationOptions
   ): Promise<{ data: Document[]; total: number; hasMore: boolean }> {
      const { page = 1, limit = 10 } = paginationOptions || {};
      const offset = (page - 1) * limit;
      const cacheKey = `${this.LIST_CACHE_PREFIX}${
         legalCaseId || 'all'
      }:${page}:${limit}`;

      try {
         const cachedData = await getCache(cacheKey);
         if (cachedData) return cachedData;

         const whereClause = legalCaseId ? { legalCaseId } : {};

         const [documents, total] = await Promise.all([
            this.prisma.document.findMany({
               where: whereClause,
               skip: offset,
               take: limit + 1, // Pour déterminer hasMore
               orderBy: { uploadedAt: 'desc' },
            }),
            this.prisma.document.count({ where: whereClause }),
         ]);

         const hasMore = documents.length > limit;
         const result = {
            data: documents.slice(0, limit),
            total,
            hasMore,
         };

         await setCache(cacheKey, result, this.CACHE_TTL);

         return result;
      } catch (error) {
         this.handleError(error, 'Failed to fetch documents');
      }
   }

   async updateByIdDocumentCase(
      id: string,
      data: DocumentUpdateData
   ): Promise<Document> {
      try {
         const updatedDocument = await this.prisma.document.update({
            where: { id },
            data: {
               ...data,
               updatedAt: new Date(),
            },
         });

         await this.handleCacheInvalidation(id);
         requestLogger(`Document updated - ID: ${id}`);
         return updatedDocument;
      } catch (error) {
         if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2025'
         ) {
            throw new NotFoundError('Document not found');
         }
         this.handleError(error, `Failed to update document ${id}`);
      }
   }

   async deleteByIdDocumentCase(id: string): Promise<void> {
      try {
         const existingDocument = await this.prisma.document.findUnique({
            where: { id },
         });
         if (!existingDocument) {
            throw new NotFoundError('Document not found');
         }

         await Promise.all([
            this.handleCacheInvalidation(id),
            this.storageService.deleteFile(existingDocument.fileUrl),
            this.prisma.document.delete({
               where: { id },
            }),
         ]);

         requestLogger(`Document deleted - ID: ${id}`);
      } catch (error) {
         if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2025'
         ) {
            throw new NotFoundError('Document not found');
         }
         this.handleError(error, `Failed to delete document ${id}`);
      }
   }

   private handleError(error: unknown, defaultMessage: string): never {
      if (error !== null) requestLogger(defaultMessage, error);

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
         switch (error.code) {
            case 'P2002':
               throw new ErrorWithStatus('Document already exists', 409);
            case 'P2003':
               throw new ErrorWithStatus('Invalid legal case reference', 400);
            case 'P2025':
               throw new NotFoundError('Document not found');
         }
      }

      if (error instanceof ErrorWithStatus || error instanceof NotFoundError) {
         throw error;
      }

      throw new ErrorWithStatus(defaultMessage, 500);
   }
}

export default DocumentCasePrismaService;
