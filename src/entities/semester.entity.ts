import { Field, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongodb';
import { Column, Entity, ObjectIdColumn } from 'typeorm';

@ObjectType()
@Entity()
export class Semester {
  @Field(() => String)
  @ObjectIdColumn()
  id: ObjectId;

  @Field()
  @Column()
  semesterNumber: number;

  @Field()
  @Column()
  startDate: Date;

  @Field()
  @Column()
  endDate: Date;

  //2024-2025
  @Field(() => String)
  @Column()
  academicYear: string;

  @Field(() => [String])
  @Column()
  subjects: ObjectId[];
}
