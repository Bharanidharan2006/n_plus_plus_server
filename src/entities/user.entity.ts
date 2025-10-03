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

  @CreateDateColumn({ type: 'timestamp with time zone' })
  @Field(() => GraphQLISODateTime, { nullable: true })
  createdAt: Date;
}
