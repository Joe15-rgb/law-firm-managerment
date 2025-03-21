import type { Request, Response } from 'express';
import {
   GroupRole,
   PrismaClient,
   type GroupMember,
   type User,
} from '@prisma/client';
import GroupPrismaService from '@app/services/group_service';

const service = new GroupPrismaService();

const prisma = new PrismaClient();

interface GroupUserCreateRequest {
   id: string;
   role: GroupRole;
}

interface GroupCreateRequest {
   name: string;
   users: GroupUserCreateRequest[];
}

interface GroupUpdateRequest {
   name?: string;
   users?: GroupUserCreateRequest[];
}

class GroupControllers {
   static async index(req: Request, res: Response) {
      try {
         const page = Number(req.query.page) || 1;
         const limit = Number(req.query.limit) || 10;

         const groups = await service.getAllGroups(page, limit);

         res.status(200).render('pages/user/group', {groups});
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: 'Internal server error' });
      }
   }

   static async create(req: Request, res: Response): Promise<void | any> {
      try {
         const { name, users }: GroupCreateRequest = JSON.parse(req.body.data);

         if (!name || !users?.length) {
            return res
               .status(400)
               .json({ error: 'Name and users are required' });
         }

         // Validation des rôles
         const validRoles = Object.values(GroupRole);
         if (users.some((u) => !validRoles.includes(u.role))) {
            return res.status(400).json({ error: 'Invalid role provided' });
         }

         const userIds = users.map((u) => u.id);
         const existingUsers = await prisma.user.findMany({
            where: { id: { in: userIds } },
         });

         if (existingUsers.length !== userIds.length) {
            const missingUsers = userIds.filter(
               (id) => !existingUsers.some((u) => u.id === id)
            );
            return res.status(404).json({
               error: `Users not found: ${missingUsers.join(', ')}`,
            });
         }

         const result = await service.createGroup({ name, users });

         req.flash('success', `Group <b>${result.name}</b> créé avec succès!`)
         res.status(201).redirect('/groups');
      } catch (error) {
         res.status(500).json({ error: 'Failed to create group' });
      }
   }

   static async update(req: Request, res: Response) {
      try {
      } catch (error) {
         res.status(500).json({ error: 'Failed to update group' });
      }
   }

   static async show(req: Request, res: Response): Promise<void | any> {
      try {
         const { id } = req.params;
         const group = await prisma.group.findUnique({
            where: { id },
         });

         if (!group) {
            return res.status(404).json({ error: 'Group not found' });
         }

         const result = await service.getOneGroup(id);

         res.status(200).json(result);
      } catch (error) {
         res.status(500).json({ error: 'Internal server error' });
      }
   }

   static async destroy(req: Request, res: Response) {
      try {
         const { id } = req.params;
         await service.deleteGroup(id);
         res.status(200).send(' ');
      } catch (error) {
         res.status(500).json({ error: 'Failed to delete group' });
      }
   }

   static async removeMember(req: Request, res: Response) {
      const {userId, groupId} = JSON.parse(req.params.ids)
      if (!userId && !groupId) {
         req.flash('error', 'mauvais identifiant')
         return res.status(400).redirect('/groups')
      }
      await service.removeMemberInGroup(userId, groupId)

      res.status(200).send('')
   }
}

export default GroupControllers;
