import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthService } from '../auth.service';
import { Role } from 'src/enums/userrole';

@Injectable()
export class RepAccessGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().req;

    const { userId } = req.user ?? {};

    if (!userId) {
      throw new UnauthorizedException();
    }

    const user = await this.authService.getUserById(userId);

    if (!user || user.role !== Role.Representative) {
      throw new UnauthorizedException('Insufficient permissions');
    }

    return true;
  }
}
