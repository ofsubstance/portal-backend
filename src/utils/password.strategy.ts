import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';


@Injectable()
export class PasswordStrategy {
  async hashPassword(password: string) {
    return await bcrypt.hash(password, 10);
  }
}
