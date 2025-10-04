import { Field, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongodb';
import { Column, Entity, ObjectIdColumn } from 'typeorm';

@ObjectType()
@Entity()
export class Subject {
  @Field(() => String)
  @ObjectIdColumn()
  id: ObjectId;

  @Field(() => String)
  @Column()
  semesterId: ObjectId;

  @Field()
  @Column()
  subjectCode: string;

  @Field()
  @Column()
  subjectTitle: string;

  @Field()
  @Column()
  credits: number;

  @Field()
  @Column()
  contactHoursPerWeek: number;

  @Field()
  @Column()
  teacherName: string;
}
