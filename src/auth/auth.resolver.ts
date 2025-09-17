import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { registerUserInput } from './dto/registerUser.dto';
import { User } from 'src/entities/user.entity';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}
  @Mutation((returns) => User)
  registerUser(@Args('input') input: registerUserInput) {
    return this.authService.registerUser(input);
  }
}
