import cluster from 'node:cluster';
import { availableParallelism } from 'node:os';
import chalk from 'chalk';
import figlet from 'figlet';
import Server from './server';
import { PORT } from '@configs/env_config';
import { middlewares, routes } from '@ioc/kernel';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedUser } from '@tools/auth';

const numCPU = availableParallelism();
const prisma = new PrismaClient();
const server = new Server({ port: PORT, middlewares, routes });
const app = server.app;

if (cluster.isPrimary) {
   console.log(chalk.blue(figlet.textSync('Server Start...')));
   console.log(chalk.green(`Primary process running with PID: ${process.pid}`));

   for (let i = 0; i < numCPU; i++) {
      cluster.fork();
   }

   cluster.on('exit', (worker, code, signal) => {
      console.log(
         chalk.yellow(
            `Worker ${worker.process.pid} exited with code ${code} and signal ${signal}. Restarting...`
         )
      );
      cluster.fork();
   });

   process.on('SIGINT', () => {
      console.log(chalk.red('Received SIGINT signal. Terminating cluster...'));
      for (const id in cluster.workers) {
         const worker = cluster.workers[id];
         if (worker) worker.kill();
      }
      process.exit(0);
   });
} else {
   console.log(chalk.cyan(`Worker process started with PID: ${process.pid}`));
   server.start();
   AuthenticatedUser();
}

export default app;
