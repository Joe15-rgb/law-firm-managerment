import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'bun';
import { statSync } from 'node:fs';
import { casbinInitAdaptator } from '@configs/casbin_config';

const prisma = new PrismaClient();

export async function PermissionSeed() {
   try {
      // Utiliser __dirname de manière compatible avec ESM
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const permission = await casbinInitAdaptator();

      const filePath = path.join(__dirname, 'casbin_rules.txt');

      if (statSync(filePath).isFile()) {
         const fileContent = await Bun.file(filePath).text();
         const policies = fileContent.split(/\r?\n/).filter(line => line.trim() !== '');

         for (const policyLine of policies) {
            const policy = policyLine.split('\t');
            if (policy.length === 3) {
               await permission?.addPolicy(policy[0], policy[1], policy[2]);
            } else {
               console.warn(`Invalid policy format: ${policyLine}`);
            }
         }
      } else {
         console.error(`File not found: ${filePath}`);
      }
   } catch (error) {
      console.error('An error occurred during policy processing:', error);
   }
}
  