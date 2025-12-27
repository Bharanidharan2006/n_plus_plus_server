import {
  Field,
  GraphQLISODateTime,
  InputType,
  Int,
  ObjectType,
} from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';
import { Gender, Role } from 'src/enums/userrole';
import { ObjectId } from 'typeorm';

@InputType()
export class registerUserInput {
  @Field()
  @IsNotEmpty()
  email: string;

  @Field()
  @IsNotEmpty()
  phoneNo: string;

  @Field()
  @IsNotEmpty()
  rollNo: number;

  @Field()
  @IsNotEmpty()
  userName: string;

  @Field()
  @IsNotEmpty()
  currentSemester: number;

  @Field()
  @IsNotEmpty()
  gender: Gender;

  @Field()
  @IsNotEmpty()
  dob: string;
  //For rep access directly edit it in the db
}

@ObjectType()
export class RegisterUserOutputUser {
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

  @Field(() => Int)
  refreshTokenVersion: number;

  @Field()
  role: Role;

  @Field(() => [Date])
  pendingDates: Date[];

  @Field(() => String)
  phoneNo: string;

  @Field(() => String, { nullable: true })
  notificationToken: string | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  createdAt: Date;
}

@ObjectType()
export class registerUserOutput {
  @Field()
  user: RegisterUserOutputUser;

  @Field()
  masterPassword: string;
}
