import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { JwtService } from '@nestjs/jwt';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Role } from 'src/enums/userrole';

@Injectable()
export class RepAccessGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().req;

    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      throw new UnauthorizedException('No Authorization header provided');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('No token found');
    }

    const payload = this.jwtService.verify(token);
    const user = await this.authService.getUser(payload.sub);
    if (!user || user.role === Role.Student) {
      return true;
    } else {
      return false;
    }
  }
}
