import type { User } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

/**
 * Middleware d'authentification pour les utilisateurs connectés avec Passport.
 * Vérifie si l'utilisateur est authentifié avec une session valide.
 */
export async function auth(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.isAuthenticated()) {
      return next();
    }
    req.flash("error", "Access denied");
    return res.status(401).redirect("/");
  } catch (error) {
    console.error("Erreur dans le middleware auth:", error);
    res.status(500).send("Internal error server");
  }
}
/**
 * Middleware pour les invités (non authentifiés).
 * Empêche les utilisateurs connectés d'accéder aux routes réservées aux invités.
 */
export async function guest(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.isAuthenticated()) {
      req.flash("warn", "Vous êtes déjà connecté.");
      const user = req.user as User;

      const userRole = user.role;

       // Redirection basée sur le rôle
      switch (userRole) {
        case "ADMIN":
          res.redirect("/admins");
          break
        case "LAWYER":
          res.redirect("/lawyers");
          break
        case "PARALEGAL":
          res.redirect("/paralegals");
          break
        default:
          res.redirect("/");
          break
      }
    } else {
      return next();
    }
  } catch (err) {
    console.error("Erreur dans le middleware guest:", err);
    res.status(500).send("Erreur interne du serveur.");
  }
}
