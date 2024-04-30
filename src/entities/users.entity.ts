import { Role } from 'src/enums/role.enum';
import { Status } from 'src/enums/status.enum';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity()
export class User extends BaseEntity {
  @Column({ length: 500 })
  name: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ default: Role.User })
  role: Role;

  @Column({ default: Status.Active })
  status: Status;
}
