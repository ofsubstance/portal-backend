import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { errorhandler, successHandler } from 'src/utils/response.handler';
import { Repository } from 'typeorm';
import { User } from './users.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

  async findUser(id: string) {
    const user = await this.userRepo.findOneBy({ id: id });
    if (!user) return errorhandler(404, 'User not found');
    const { password, ...response } = user;
    return successHandler('User found', response);
  }

  async findUserByEmail(email: string) {
    const user = await this.userRepo.findBy({ email: email });
    return user;
  }

  async findAllUsers() {
    const users = await this.userRepo.find();
    if (!users.length) return errorhandler(404, 'User not found');
    const usersWithoutPassword = [];

    users.map((user) => {
      const { password, ...userWithoutPassword } = user;
      usersWithoutPassword.push(userWithoutPassword);
    });
    return successHandler('Users found', usersWithoutPassword);
  }

  async updateUser(id: string, attributes: Partial<User>) {
    const user = await this.userRepo.findOneBy({ id: id });
    if (!user) return errorhandler(404, 'User not found');
    Object.assign(user, attributes);
    const updatedUser = await this.userRepo.save(user);
    const { password, ...response } = updatedUser;
    return successHandler('User updated successfully', response);
  }

  async deleteUser(id: string) {
    const user = await this.userRepo.findOneBy({ id: id });
    if (!user) errorhandler(404, 'User not found');
    await this.userRepo.remove(user);
    return successHandler('User deleted successfully', null);
  }
}
