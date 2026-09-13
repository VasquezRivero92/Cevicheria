import { getRepositories } from '../infrastructure/repositories/factory.js';
export class AuthService {
    repos = getRepositories();
    async loginWithUsername(username) {
        const user = await this.repos.userRepo.getByUsername(username);
        if (!user || !user.active)
            return null;
        return user;
    }
    async loginWithPin(pin) {
        const user = await this.repos.userRepo.getByPin(pin);
        if (!user || !user.active)
            return null;
        return user;
    }
    async getUserById(id) {
        return this.repos.userRepo.getById(id);
    }
}
