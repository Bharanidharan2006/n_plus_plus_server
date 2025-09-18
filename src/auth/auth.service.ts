import {
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { ObjectId, Repository } from 'typeorm';
import { registerUserInput } from './dto/registerUser.dto';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/enums/userrole';
import { JwtService } from '@nestjs/jwt';
import { FirstTimeLoginInput } from './dto/loginUser.dto';

//Todo
// [ ] - Add try catch block to user repository methods
// [ ] - Also don't just use rollno to logout
// [ ] - differentiate between firstTimeLogin and changePassword and try to merge them

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async getAccessToken(userId: string) {
    const access_token = await this.jwtService.signAsync({ sub: userId });
    return access_token;
  }

  async getRefreshToken(userId: string, tokenVersion: number) {
    const refresh_token = await this.jwtService.signAsync(
      {
        sub: userId,
        tokenVersion,
      },
      { expiresIn: '7d' },
    );
    return refresh_token;
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userRepository.findOneBy({ id: payload.userId });

      if (!user) throw new UnauthorizedException();
      if (payload.tokenVersion !== user.refreshTokenVersion) {
        throw new UnauthorizedException('Token revoked');
      }

      return {
        accessToken: this.getAccessToken(user.id.toString()),
        refreshToken: this.getRefreshToken(
          user.id.toString(),
          user.refreshTokenVersion,
        ),
      };
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(rollno: number) {
    const user = await this.userRepository.findOne({
      where: { rollNo: rollno },
    });
    if (!user) throw new HttpException('Invalid cerenditials', 404);
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

    user.password = await bcrypt.hash(newPass, 10);
    user.refreshTokenVersion += 1; // revoke all refresh tokens
    await this.userRepository.save(user);

    return true;
  }

  async registerUser(input: registerUserInput) {
    const mPassword = (await import('nanoid')).nanoid(12);
    console.log(mPassword);

    const hashedMasterPassword = await bcrypt.hash(mPassword, 12);

    //const hashedPassword = await bcrypt.hash(input.password, 12);

    const newUser = {
      email: input.email,
      userName: input.userName,
      currentSemester: input.currentSemester,
      rollNo: input.rollNo,
      password: undefined,
      attendance: input.attendance,
      masterPassword: hashedMasterPassword,
      refreshTokenVersion: 0,
      role: Role.Student,
    };

    const savedUser = (await this.userRepository.save(newUser)) as User;
    //console.log(savedUser);

    const { password, masterPassword, ...result } = savedUser;

    return result;
  }

  async validateUser(rollno: number, password: string) {
    const user = await this.userRepository.findOne({
      where: { rollNo: rollno },
    });
    //console.log(user);

    if (!user) return null;
    const isPasswordMatching = await bcrypt.compare(password, user.password);

    if (!isPasswordMatching) return null;

    return user;
  }

  async firstTimeLogin(input: FirstTimeLoginInput) {
    const user = await this.userRepository.findOne({
      where: { rollNo: input.rollno },
    });

    if (user) {
      const isMasterPasswordMatched = await bcrypt.compare(
        input.masterPassword,
        user.masterPassword,
      );
      if (!isMasterPasswordMatched) {
        throw new HttpException("Master password doesn't match", 401);
      }
      const hashedPassword = await bcrypt.hash(input.password, 12);
      user.password = hashedPassword;
      await this.userRepository.save(user);
      const accessToken = await this.getAccessToken(user.id.toString());
      const refreshToken = await this.getRefreshToken(
        user.id.toString(),
        user.refreshTokenVersion,
      );
      return { accessToken, refreshToken };
    } else {
      throw new HttpException("User with the given rollno doesn't exist", 404);
    }
  }
}
