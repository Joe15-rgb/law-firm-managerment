import GroupPrismaService from "@app/services/group_service";
import { prisma } from "@db/seeds/users_seed";
import type { Request, Response } from "express";

const groupService = new GroupPrismaService()

class AdminControllers {
  static async index(req: Request, res: Response) {
    try {
      const groups = await groupService.getAllGroups()
      res.status(200).render('pages/admin/index', {groups})
    } catch (error) {
      AdminControllers.handlerControllerError(res, error, 'Erreur lors du rendu de la page administrateur')
    }
  }
  /**
     * Centralise la gestion des erreurs des contrôleurs.
     */
  private static handlerControllerError(
    res: Response,
    error: unknown,
    message: string
  ) {
    console.error('Auth Controller Error:', error);
    res.status(500).render('Internal error server', { message });
  }
}

export default AdminControllers