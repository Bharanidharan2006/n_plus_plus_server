// gql-jwt.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';

@Injectable()
export class GqlJwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
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

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
      return true;
    } catch (error) {
      console.log(error);
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException({
          message: 'Access token expired. Please use refresh token.',
        });
      } else if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException('Invalid access token');
      } else {
        throw new UnauthorizedException('Unauthorized');
      }
    }
  }
}
