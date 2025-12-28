import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Entity, ObjectIdColumn, ObjectId, Column } from 'typeorm';

@ObjectType()
@Entity()
export class CronStatus {
  @Field(() => String)
  @ObjectIdColumn()
  id: ObjectId;

  @Field()
  @Column({ nullable: false })
  cronId: string;

  @Field()
  @Column({ nullable: false })
  date: string;
}
