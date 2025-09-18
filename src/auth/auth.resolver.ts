import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { registerUserInput, registerUserOutput } from './dto/registerUser.dto';
import { User } from 'src/entities/user.entity';
import { FirstTimeLoginInput, LoginResponse } from './dto/loginUser.dto';
import { HttpException } from '@nestjs/common';
import { changePasswordInput } from './dto/changePassword.dto';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}
  @Mutation((returns) => registerUserOutput)
  registerUser(@Args('input') input: registerUserInput) {
    return this.authService.registerUser(input);
  }

  @Mutation((returns) => LoginResponse)
  firstTimeLogin(@Args('input') input: FirstTimeLoginInput) {
    return this.authService.firstTimeLogin(input);
  }

  @Mutation((returns) => LoginResponse)
  async loginUser(
    @Args('rollno') rollno: number,
    @Args('password') password: string,
  ) {
    const user = await this.authService.validateUser(rollno, password);
    if (!user) {
      throw new HttpException('Invalid ceredentials', 401);
    }
    const accessToken = await this.authService.getAccessToken(
      user.id.toString(),
    );
    const refreshToken = await this.authService.getRefreshToken(
      user.id.toString(),
      user.refreshTokenVersion,
    );
    return { accessToken, refreshToken };
  }

  @Mutation((returns) => LoginResponse)
  refreshToken(@Args('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  @Mutation((returns) => Boolean)
  logout(@Args('rollno') rollno: number) {
    return this.authService.logout(rollno);
  }

  @Mutation((returns) => Boolean)
  changePassword(@Args('input') input: changePasswordInput) {
    return this.authService.changePassword(
      input.rollno,
      input.masterPassword,
      input.password,
    );
  }
}
