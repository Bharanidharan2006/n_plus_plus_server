import {
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import * as dotenv from 'dotenv';
import { User } from 'src/entities/user.entity';
import { registerUserInput } from './dto/registerUser.dto';
import { Role } from 'src/enums/userrole';
import { ObjectId } from 'mongodb';

dotenv.config();

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: MongoRepository<User>,
    private jwtService: JwtService,
  ) {}

  /* ---------------- TOKEN HELPERS ---------------- */

  async getAccessToken(userId: string) {
    return this.jwtService.signAsync(
      { sub: userId },
      {
        expiresIn: '15m',
        secret: process.env.JWT_ACCESS_SECRET,
      },
    );
  }

  async getRefreshToken(userId: string, tokenVersion: number) {
    return this.jwtService.signAsync(
      { sub: userId, tokenVersion },
      {
        expiresIn: '7d',
        secret: process.env.JWT_REFRESH_SECRET,
      },
    );
  }

  async getUserIdFromToken(token: string) {
    const payload = await this.jwtService.verifyAsync(token, {
      secret: process.env.JWT_ACCESS_SECRET,
    });
    return payload.sub;
  }

  /* ---------------- AUTH FLOWS ---------------- */

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.userRepository.findOneById(
        new ObjectId(payload.sub),
      );

      if (!user) throw new UnauthorizedException();

      if (payload.tokenVersion !== user.refreshTokenVersion) {
        throw new UnauthorizedException('Token revoked');
      }

      return {
        accessToken: await this.getAccessToken(user.id.toString()),
        refreshToken: await this.getRefreshToken(
          user.id.toString(),
          user.refreshTokenVersion,
        ),
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(rollno: number) {
    const user = await this.userRepository.findOne({
      where: { rollNo: rollno },
    });

    if (!user) throw new UnauthorizedException();

    user.refreshTokenVersion++;
    await this.userRepository.save(user);
    return true;
  }

  async changePassword(rollno: number, masterPass: string, newPass: string) {
    const user = await this.userRepository.findOne({
      where: { rollNo: rollno },
    });

    if (!user) throw new UnauthorizedException('User not found');

    const isValid = await bcrypt.compare(masterPass, user.masterPassword);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    user.password = await bcrypt.hash(newPass, 12);
    user.refreshTokenVersion++;
    await this.userRepository.save(user);

    return true;
  }

  async registerUser(input: registerUserInput) {
    const mPassword = (await import('nanoid')).nanoid(12);
    const hashedMasterPassword = await bcrypt.hash(mPassword, 12);

    const newUser = this.userRepository.create({
      email: input.email,
      userName: input.userName,
      currentSemester: input.currentSemester,
      rollNo: input.rollNo,
      password: undefined,
      masterPassword: hashedMasterPassword,
      refreshTokenVersion: 0,
      phoneNo: input.phoneNo,
      role: Role.Student,
      pendingDates: [],
      gender: input.gender,
      dob: input.dob,
      notificationToken: null,
    });

    const savedUser = await this.userRepository.save(newUser);

    const { password, masterPassword, ...result } = savedUser;

    return {
      user: result,
      masterPassword: mPassword,
    };
  }

  async validateUser(rollno: number, password: string) {
    const user = await this.userRepository.findOne({
      where: { rollNo: rollno },
    });

    if (!user || !user.password) return null;

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;

    return user;
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findOneById(new ObjectId(id));

    if (!user) throw new HttpException('User not found', 404);
    return user;
  }

  async getUserFromAccessToken(token: string) {
    const userId = await this.getUserIdFromToken(token);
    const user = await this.userRepository.findOneById(new ObjectId(userId));

    if (!user) throw new UnauthorizedException();
    return user;
  }
}
