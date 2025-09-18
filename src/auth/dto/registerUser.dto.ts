import {
  Field,
  GraphQLISODateTime,
  InputType,
  Int,
  ObjectType,
} from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';
import { Role } from 'src/enums/userrole';
import { ObjectId } from 'typeorm';

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

@ObjectType()
export class registerUserOutput {
  @Field(() => String)
  id: string;

  @Field()
  email: string;

  @Field()
  rollNo: number;

  @Field()
  userName: string;

  @Field()
  currentSemester: number;

  @Field(() => [[Int]])
  attendance: number[][];

  @Field(() => Int)
  refreshTokenVersion: number;

  @Field()
  role: Role;

  @Field(() => GraphQLISODateTime, { nullable: true })
  createdAt: Date;
}
