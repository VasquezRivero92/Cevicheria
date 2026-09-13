import { getRepositories } from '../infrastructure/repositories/factory.js';
import { User } from '../domain/types.js';

export class AuthService {
  private repos = getRepositories();

  async loginWithUsername(username: string): Promise<User | null> {
    const user = await this.repos.userRepo.getByUsername(username);
    if (!user || !user.active) return null;
    return user;
  }

  async loginWithPin(pin: string): Promise<User | null> {
    const user = await this.repos.userRepo.getByPin(pin);
    if (!user || !user.active) return null;
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.repos.userRepo.getById(id);
  }
}
