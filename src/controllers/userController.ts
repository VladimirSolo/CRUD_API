import { IncomingMessage, ServerResponse } from 'http';
import { userService } from '../services/userService';
import { CreateUserDto, UpdateUserDto } from '../types/user';

class UserController {
  async getAllUsers(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const users = await userService.getAllUsers();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(users));
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async getUserById(req: IncomingMessage, res: ServerResponse, userId: string): Promise<void> {
    try {
      const user = await userService.getUserById(userId);

      if (!user) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: 'User not found' }));
        return;
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(user));
    } catch (error: any) {
      if (error.message === 'Invalid user ID') {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: error.message }));
        return;
      }
      this.handleError(res, error);
    }
  }

  async createUser(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const body = await this.parseBody(req);
      const dto: CreateUserDto = body;

      const newUser = await userService.createUser(dto);

      res.statusCode = 201;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(newUser));
    } catch (error: any) {
      if (error.message.includes('required') || error.message.includes('must be')) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: error.message }));
        return;
      }
      this.handleError(res, error);
    }
  }

  async updateUser(req: IncomingMessage, res: ServerResponse, userId: string): Promise<void> {
    try {
      const body = await this.parseBody(req);
      const dto: UpdateUserDto = body;

      const updatedUser = await userService.updateUser(userId, dto);

      if (!updatedUser) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: 'User not found' }));
        return;
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(updatedUser));
    } catch (error: any) {
      if (error.message === 'Invalid user ID') {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: error.message }));
        return;
      }
      this.handleError(res, error);
    }
  }

  async deleteUser(req: IncomingMessage, res: ServerResponse, userId: string): Promise<void> {
    try {
      const deleted = await userService.deleteUser(userId);

      if (!deleted) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: 'User not found' }));
        return;
      }

      res.statusCode = 204;
      res.end();
    } catch (error: any) {
      if (error.message === 'Invalid user ID') {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: error.message }));
        return;
      }
      this.handleError(res, error);
    }
  }

  private async parseBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(new Error('Invalid JSON'));
        }
      });
      req.on('error', reject);
    });
  }

  private handleError(res: ServerResponse, error: any): void {
    console.error('Error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Internal server error' }));
  }
}

export const userController = new UserController();