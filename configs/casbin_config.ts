/*********************************************
 * CASBIN CONFIG WITH ADAPTER FOR PRISMA ORM *
 *********************************************/

import { statSync } from 'node:fs';
import { newEnforcer } from "casbin";
import { PrismaAdapter } from "casbin-prisma-adapter";
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export async function casbinInitAdaptator() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const model = path.join(__dirname, './rbac_model.conf')
  try {
    if (statSync(model).isFile()) {
      const adapter = await PrismaAdapter.newAdapter()
      const enforcer = await newEnforcer(model, adapter);
      await enforcer.loadPolicy();

      return enforcer;
    }
    throw new Error('Model config is not defined')

  } catch (err) {
    console.error(err);
  }
}