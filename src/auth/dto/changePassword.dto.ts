import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class changePasswordInput {
  @Field()
  rollno: number;

  @Field()
  masterPassword: string;

  @Field()
  password: string;
}
