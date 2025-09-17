import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@InputType()
export class registerUserInput {
  @Field()
  @IsNotEmpty()
  email: string;

  @Field()
  @IsNotEmpty()
  rollNo: number;

  @Field()
  @IsNotEmpty()
  userName: string;

  @Field()
  @IsNotEmpty()
  currentSemester: number;

  @Field(() => [[Int]])
  @IsNotEmpty()
  attendance: number[][];

  //For rep access directly edit it in the db
}
