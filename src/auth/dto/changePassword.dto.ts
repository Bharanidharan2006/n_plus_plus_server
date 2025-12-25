import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@InputType()
export class changePasswordInput {
  @Field()
  @IsNotEmpty()
  rollno: number;

  @Field()
  @IsNotEmpty()
  password: string;

  @Field()
  @IsNotEmpty()
  masterPassword: string;
}
