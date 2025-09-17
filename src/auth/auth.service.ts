import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { registerUserInput } from './dto/registerUser.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async registerUser(input: registerUserInput) {
    const masterPassword = (await import('nanoid')).nanoid(12);
    console.log(masterPassword);

    const hashedMasterPassword = await bcrypt.hash(masterPassword, 12);

    //const hashedPassword = await bcrypt.hash(input.password, 12);

    const newUser = {
      email: input.email,
      userName: input.userName,
      currentSemester: input.currentSemester,
      rollNo: input.rollNo,
      password: undefined,
      attendance: input.attendance,
      masterPassword: hashedMasterPassword,
    };

    return await this.userRepository.save(newUser);
  }
}
