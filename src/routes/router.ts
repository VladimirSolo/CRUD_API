import { IncomingMessage, ServerResponse } from 'http';
import { userController } from '../controllers/userController';

export class Router {
  async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = req.url || '';
    const method = req.method || '';

    const usersPattern = /^\/api\/users\/?$/;

    const userByIdPattern = /^\/api\/users\/([^/]+)\/?$/;

    if (usersPattern.test(url)) {
      if (method === 'GET') {
        await userController.getAllUsers(req, res);
      } else if (method === 'POST') {
        await userController.createUser(req, res);
      } else {
        this.sendNotFound(res, 'Method not allowed');
      }
    } else {
      const match = url.match(userByIdPattern);
      if (match) {
        const userId = match[1];

        if (method === 'GET') {
          await userController.getUserById(req, res, userId);
        } else if (method === 'PUT') {
          await userController.updateUser(req, res, userId);
        } else if (method === 'DELETE') {
          await userController.deleteUser(req, res, userId);
        } else {
          this.sendNotFound(res, 'Method not allowed');
        }
      } else {
        this.sendNotFound(res, 'Endpoint not found');
      }
    }
  }

  private sendNotFound(res: ServerResponse, message: string): void {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message }));
  }
}

export const router = new Router();