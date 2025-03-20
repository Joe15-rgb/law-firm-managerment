import { asyncMiddleware } from "@app/middlewares/asyncMiddleware";
import { upload } from "@app/middlewares/uploder_middleware";
import DocumentCasePrismaService from "@app/services/document_service";
import { DocumentType } from "@prisma/client";
import StorageService from "@services/storage";
import { ErrorWithStatus } from "@tools/errors";
import type { Request, Response } from "express";
import Joi from "joi";

// Schémas de validation Joi
const DocumentCreateSchema = Joi.object({
  legalCaseId: Joi.string().required().uuid(),
  title: Joi.string().required().max(150),
  description: Joi.string().optional().allow(''),
  documentType: Joi.string()
    .valid(...Object.values(DocumentType))
    .required(),
});

const DocumentUpdateSchema = Joi.object({
  title: Joi.string().max(150),
  description: Joi.string().optional().allow(''),
  documentType: Joi.string().valid(...Object.values(DocumentType)),
}).min(1);

class DocumentController {
  private static documentService = new DocumentCasePrismaService();
  private static storageService = new StorageService();
  private static upload = upload;

  static create = [
    this.upload.single('file'),
    asyncMiddleware(async (req: Request, res: Response) => {
      const { error, value } = DocumentCreateSchema.validate(req.body);
      if (error) {
        res.send(error.details)
        // throw new ErrorWithStatus('Validation failed', 400);
      }

      const { legalCaseId, title, description, documentType } = value;
      const file = req.file;

      if (!file) {
        throw new ErrorWithStatus('File is required', 400);
      }

      // Validation du type MIME
      const allowedMimeTypes = [
        'application/pdf',
        'application/docx',
        'application/doc',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'text/plain',
      ];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new ErrorWithStatus('Unsupported file type', 400);
      }

      const newDocument = await this.documentService.createDocumentCase({
        title,
        description,
        fileName: file.originalname,
        fileUrl: file.path,
        legalCaseId,
        mimeType: file.mimetype,
        documentType,
        size: file.size
      });


      // res.status(201).json({
      //   status: 'success',
      //   data: this.sanitizeDocument(newDocument)
      // });
      req.flash('success', 'Element ajouter avec success')
      res.status(201).redirect('/lawyers')
    })
  ];

  static update = [
    this.upload.single('file'),
    asyncMiddleware(async (req: Request, res: Response) => {
      const { error, value } = DocumentUpdateSchema.validate(req.body);
      if (error) {
        throw new ErrorWithStatus('Validation failed', 400);
      }

      const updateData = value;
      const file = req.file;
      let fileUpdates = {};

      if (file) {
        const existingDoc = await this.documentService.getOneByIdDocumentCase(req.params.id);

        // Validation du type MIME
        const allowedMimeTypes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'text/plain',
        ];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          throw new ErrorWithStatus('Unsupported file type', 400);
        }

        await this.storageService.deleteFile(existingDoc.fileUrl);

        const newFileUrl = await this.storageService.writeFile(
          `documents/${existingDoc.legalCaseId}/${Date.now()}-${file.originalname}`,
          file.buffer
        );

        fileUpdates = {
          fileName: file.originalname,
          fileUrl: newFileUrl,
          size: file.size,
          mimeType: file.mimetype
        };
      }

      const updatedDocument = await this.documentService.updateByIdDocumentCase(
        req.params.id,
        { ...updateData, ...fileUpdates }
      );

      res.json({
        status: 'success',
        data: this.sanitizeDocument(updatedDocument)
      });
    })
  ];

  private static sanitizeDocument(document: any) {
    const { fileUrl, legalCaseId, ...sanitized } = document;
    return sanitized;
  }

}

export default DocumentController;