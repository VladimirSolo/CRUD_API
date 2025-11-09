import { v4 as uuidv4 } from 'uuid';
import { db } from './../db/database';
import { User, CreateUserDto, UpdateUserDto } from '../types/user';
import { isValidUuid } from './../utils/validation';

export class UserService {
  async getAllUsers(): Promise<User[]> {
    return await db.getAll();
  }

  async getUserById(id: string): Promise<User | null> {
    if (!isValidUuid(id)) {
      throw new Error('Invalid user ID');
    }

    const user = await db.getById(id);
    if (!user) {
      return null;
    }

    return user;
  }

  async createUser(dto: CreateUserDto): Promise<User> {
    this.validateCreateUserDto(dto);

    const newUser: User = {
      id: uuidv4(),
      username: dto.username,
      age: dto.age,
      hobbies: dto.hobbies,
    };

    return await db.create(newUser);
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<User | undefined> {
    if (!isValidUuid(id)) {
      throw new Error('Invalid user ID');
    }
    const existingUser = await db.getById(id);
    if (!existingUser) {
      return undefined;
    }
    const updatedUser: User = {
      id: existingUser.id,
      username: dto.username ?? existingUser.username,
      age: dto.age ?? existingUser.age,
      hobbies: dto.hobbies ?? existingUser.hobbies,
    };
    return await db.update(id, updatedUser);
  }

  async deleteUser(id: string): Promise<boolean> {
    if (!isValidUuid(id)) {
      throw new Error('Invalid user ID');
    }

    const user = await db.getById(id);
    if (!user) {
      return false;
    }

    return await db.delete(id);
  }

  private validateCreateUserDto(dto: CreateUserDto): void {
    if (!dto.username || typeof dto.username !== 'string') {
      throw new Error('Username is required and must be a string');
    }

    if (dto.age === undefined || typeof dto.age !== 'number') {
      throw new Error('Age is required and must be a number');
    }

    if (!Array.isArray(dto.hobbies)) {
      throw new Error('Hobbies is required and must be an array');
    }

    if (!dto.hobbies.every((hobby) => typeof hobby === 'string')) {
      throw new Error('All hobbies must be strings');
    }
  }
}

export const userService = new UserService();