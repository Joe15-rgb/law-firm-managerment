import { ClientPrismaService } from '@app/services/client_service';
import { clientValidatorData } from '@app/validators/client_validator';
import { NotFoundError } from '@tools/errors';
import type { Request, Response } from 'express';

const service = new ClientPrismaService();

class ClientControllers {
   static async index(req: Request, res: Response) {
      const clients = await service.getAllClients();
      res.status(200).render('pages/client/index', { clients });
   }
   static async create(req: Request, res: Response): Promise<void | any> {
      try {
         const { error, value } = clientValidatorData(req.body);
         if (error) return res.status(400).send(error.details[0].message);

         const data = {
            ...value,
            birthDate: new Date(value.birthDate).toISOString(),
         };

         const newClient = await service.createClient(data);
         req.flash('success', `Client enregistre avec succès ${newClient.id}`)
         res.status(201).redirect('/clients');
      } catch (error) {
         console.error(error);
         res.status(500).send('Internal error server');
      }
   }
   static async show(req: Request, res: Response) {
      try {
         const { id } = req.params;
         const client = await service.getOneClient(id);

         if (!client) new NotFoundError('Client not trouve');

         res.status(200).send(client);
      } catch (error) {
         console.error(error);
         res.status(500).send('Internal error server');
      }
   }
}

export default ClientControllers;
