import { hashSync } from 'bcryptjs';
import fs from 'node:fs';
import path from 'path';
/**
 * Capitalizes the first letter of a string and trims any extra whitespace.
 * @param string - The input string to be capitalized.
 * @returns The capitalized and trimmed string.
 */
export function toLocalCapitalize(string: string): string {
   if (!string) return ''; // Handle empty strings safely
   return string.charAt(0).toUpperCase() + string.slice(1).trim();
}

/**
 * Generates a version 7 UUID using Bun's built-in randomUUIDv7 method.
 * @returns The generated UUID as a string.
 */
export function cuid(): string {
   return Bun.randomUUIDv7();
}

/**
 * Hashes a password using bcrypt with a given salt value.
 * @param password - The password to hash.
 * @param salt - The salt value (typically a number indicating salt rounds).
 * @returns The hashed password as a string.
 */
export function serializePassword(password: string, salt: number = 10): string {
   if (!password) return ''; // Handle empty strings safely
   return hashSync(password, salt);
}

/**
 * Deeps compare
 * @param objA
 * @param objB
 * @returns true if compare
 */
export function deepCompare(objA: any, objB: any): boolean {
   if (objA === objB) return true;

   if (
      typeof objA !== 'object' ||
      objA === null ||
      typeof objB !== 'object' ||
      objB === null
   ) {
      return false;
   }

   const keysA = Object.keys(objA);
   const keysB = Object.keys(objB);

   if (keysA.length !== keysB.length) return false;

   return keysA.every(
      (key) => keysB.includes(key) && deepCompare(objA[key], objB[key])
   );
}

export function deletePublicFile(filename: string, publicDir: string): boolean {
   // Vérification des entrées
   if (!filename || !publicDir) {
      throw new Error('Les paramètres filename et publicDir sont obligatoires');
   }

   // Construction des chemins absolus
   const publicDirPath = path.resolve(publicDir);
   const filePath = path.resolve(path.join(publicDirPath, filename));

   // Protection contre les directory traversal
   if (!filePath.startsWith(publicDirPath)) {
      throw new Error('Chemin non autorisé');
   }

   try {
      // Vérification de l'existence du fichier
      fs.accessSync(filePath, fs.constants.F_OK);
      // Suppression du fichier
      fs.unlinkSync(filePath);
      return true;
   } catch (error) {
      if (isSystemError(error) && error.code === 'ENOENT') {
         return false; // Fichier non trouvé
      }
      throw error; // Propagation des autres erreurs
   }
}

// Utilitaire pour la vérification de type des erreurs système
function isSystemError(error: unknown): error is NodeJS.ErrnoException {
   return error instanceof Error && 'code' in error;
}
