import LawyerPrismaService from "@app/services/lawyer_service";
import type { User } from "@prisma/client";
import type { Request, Response } from "express";

const service = new LawyerPrismaService();

class LawyerControllers {
  static async index(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const parsedPage = Math.max(parseInt(String(page), 10) || 1, 1);
      const parsedLimit = Math.max(parseInt(String(limit), 10) || 10, 1);

      const userAuthenticated = req.user as User;

      const [assignedLedgers, groups, groupLedgers] = await Promise.all([
        service.getAssignedLedgersByCurrentLawyer(userAuthenticated.id),
        service.getGroupsWhereLawyerIsMember(userAuthenticated.id),
        service.getGroupAssignedLedgersByCurrentLawyer(userAuthenticated.id)
      ]);
      // res.json(groups)

      res.status(200).render('pages/lawyer/index', {
        ledgers: assignedLedgers,
        groups,
        ledgersGroup: groupLedgers,
        currentPage: parsedPage,
        itemsPerPage: parsedLimit
      });
    } catch (error) {
      LawyerControllers.handleControllerError(
        res,
        error,
        'Erreur lors du rendu de la page des avocats'
      );
    }
  }

  /**
   * Gestion centralisée des erreurs des contrôleurs
   */
  private static handleControllerError(
    res: Response,
    error: unknown,
    defaultMessage: string = 'Une erreur est survenue'
  ) {
    console.error('Lawyer Controller Error:', error);

    const statusCode = error instanceof Error && 'statusCode' in error
      ? Number(error.statusCode)
      : 500;

    const message = error instanceof Error
      ? error.message
      : defaultMessage;

    res.status(statusCode).render('pages/error', {
      message,
      statusCode,
      layout: 'error'
    });
  }
}

export default LawyerControllers;