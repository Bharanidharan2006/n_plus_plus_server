import { Field, InputType, ObjectType } from '@nestjs/graphql';

@InputType()
export class FirstTimeLoginInput {
  @Field()
  rollno: number;

  @Field()
  masterPassword: string;

  @Field()
  password: string;
}

@ObjectType()
export class LoginResponse {
  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;
}
