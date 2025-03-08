import {prisma, UserSeeds} from './users_seed'
import { PermissionSeed } from './permission_seed';

(async ()=>{
      await UserSeeds()
      await PermissionSeed()

      console.table(await prisma.user.findMany())
      console.table(await prisma.casbinRule.findMany())
})()