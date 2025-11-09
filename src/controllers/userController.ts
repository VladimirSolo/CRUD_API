import { IncomingMessage, ServerResponse } from 'http';
import { CreateUserDto, UpdateUserDto } from './../types/user';
import { userService } from '../services/userService';

export class UserController {
  async getAllUsers(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const users = await userService.getAllUsers();
      this.sendJsonResponse(res, 200, users);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async getUserById(req: IncomingMessage, res: ServerResponse, userId: string): Promise<void> {
    try {
      const user = await userService.getUserById(userId);

      if (user === null) {
        this.sendJsonResponse(res, 404, { message: 'User not found' });
        return;
      }

      this.sendJsonResponse(res, 200, user);
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid user ID') {
        this.sendJsonResponse(res, 400, { message: 'Invalid user ID (not UUID)' });
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
      this.sendJsonResponse(res, 201, newUser);
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes('required') ||
          error.message.includes('must be')
        ) {
          this.sendJsonResponse(res, 400, { message: error.message });
          return;
        }
      }
      this.handleError(res, error);
    }
  }

  async updateUser(req: IncomingMessage, res: ServerResponse, userId: string): Promise<void> {
    try {
      const body = await this.parseBody(req);
      const dto: UpdateUserDto = body;

      const updatedUser = await userService.updateUser(userId, dto);

      if (updatedUser === null) {
        this.sendJsonResponse(res, 404, { message: 'User not found' });
        return;
      }

      this.sendJsonResponse(res, 200, updatedUser);
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid user ID') {
        this.sendJsonResponse(res, 400, { message: 'Invalid user ID (not UUID)' });
        return;
      }
      this.handleError(res, error);
    }
  }

  async deleteUser(req: IncomingMessage, res: ServerResponse, userId: string): Promise<void> {
    try {
      const deleted = await userService.deleteUser(userId);

      if (!deleted) {
        this.sendJsonResponse(res, 404, { message: 'User not found' });
        return;
      }

      res.statusCode = 204;
      res.end();
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid user ID') {
        this.sendJsonResponse(res, 400, { message: 'Invalid user ID (not UUID)' });
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
          const parsed = JSON.parse(body);
          resolve(parsed);
        } catch (error) {
          reject(new Error('Invalid JSON in request body'));
        }
      });

      req.on('error', (error) => {
        reject(error);
      });
    });
  }

  private sendJsonResponse(res: ServerResponse, statusCode: number, data: any): void {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  }

  private handleError(res: ServerResponse, error: unknown): void {
    console.error('Server error:', error);
    this.sendJsonResponse(res, 500, {
      message: 'Internal server error',
    });
  }
}

export const userController = new UserController();