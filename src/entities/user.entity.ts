import { Field, GraphQLISODateTime, Int, ObjectType } from '@nestjs/graphql';
import {
  Entity,
  ObjectIdColumn,
  Column,
  ObjectId,
  CreateDateColumn,
} from 'typeorm';
import { IsEmail } from 'class-validator';
import { Role } from 'src/enums/userrole';

@ObjectType()
@Entity()
export class User {
  @Field(() => String)
  @ObjectIdColumn()
  id: ObjectId;

  @Field()
  @Column()
  @IsEmail()
  email: string;

  // This attribute stores the dates for which the student has not updated the attendance
  @Field(() => [Date])
  @Column({ default: [] })
  pendingDates: Date[];

  @Field()
  @Column()
  rollNo: number;

  @Field({ nullable: false })
  @Column()
  masterPassword: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  password: string;

  @Field({ nullable: false })
  @Column({ update: false })
  userName: string;

  @Field(() => Int, { nullable: false })
  @Column()
  currentSemester: number;

  @Field(() => String, { nullable: false })
  @Column({
    type: 'enum',
    enum: Role,
    default: Role.Student,
  })
  role: Role;

  @Field(() => Int)
  @Column()
  refreshTokenVersion: number;

  @Field(() => String)
  @Column({ default: null })
  notificationToken: string;

  @Field(() => String)
  @Column({ nullable: false })
  phoneNo: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  @Field(() => GraphQLISODateTime, { nullable: true })
  createdAt: Date;
}
