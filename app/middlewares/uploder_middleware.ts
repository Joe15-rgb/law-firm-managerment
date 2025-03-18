import type { Request } from "express";
import type { StorageEngine, FileFilterCallback } from "multer";
import multer from "multer"
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from 'uuid';

// Dossiers pour stocker les fichiers
const TEMP_DIR = "uploads/tmp";
const IMAGE_DIR = "uploads/images";
const DOCS_DIR = "uploads/docs";

// Création des dossiers s'ils n'existent pas
const createDirectories = () => {
  [TEMP_DIR, IMAGE_DIR, DOCS_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createDirectories();

// Configurer le stockage Multer
const storage: StorageEngine = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    let folder = TEMP_DIR;

    if (file.mimetype.startsWith("image")) {
      folder = IMAGE_DIR;
    } else if (file.mimetype === "application/pdf" || file.mimetype.includes("document")) {
      folder = DOCS_DIR;
    }

    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

// Filtre pour accepter uniquement certains types de fichiers
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (
    file.mimetype.startsWith("image") ||
    file.mimetype === "application/pdf" ||
    file.mimetype.includes("document")
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// Middleware Multer avec le filtre et le stockage configurés
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de taille de fichier : 5 Mo
  },
});

// Middleware pour nettoyer les fichiers dans le dossier temporaire après un délai
const cleanTempFiles = (durationInMs: number) => {
  setInterval(() => {
    fs.readdir(TEMP_DIR, (err, files) => {
      if (err) {
        console.error("Erreur de lecture du dossier temporaire:", err);
        return;
      }

      files.forEach((file) => {
        const filePath = path.join(TEMP_DIR, file);
        fs.stat(filePath, (err, stats) => {
          if (err) {
            console.error("Erreur de lecture du fichier temporaire:", err);
            return;
          }

          const now = Date.now();
          if (now - stats.mtimeMs > durationInMs) {
            fs.unlink(filePath, (err) => {
              if (err) console.error("Erreur de suppression du fichier:", err);
              else console.log(`Fichier temporaire supprimé : ${file}`);
            });
          }
        });
      });
    });
  }, durationInMs);
};

// Démarrer la suppression automatique des fichiers temporaires (ex: tous les 24h)
cleanTempFiles(24 * 60 * 60 * 1000); // 24 heures en millisecondes

export { upload };
