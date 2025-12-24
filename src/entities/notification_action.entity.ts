import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Entity, ObjectIdColumn, ObjectId, Column } from 'typeorm';

// This entity stores the action id, along with the rollNo, so that when a request comes in with a specific action id, we know which user's attendance to update.

// Why not use the object_id, itself as the action id ?

@ObjectType()
@Entity()
export class NotificationAction {
  @Field(() => String)
  @ObjectIdColumn()
  id: ObjectId;

  @Field(() => Boolean)
  @Column({ default: false })
  isUpdated: boolean;

  @Field()
  @Column({ nullable: false })
  date: Date;

  @Field(() => Int)
  @Column({ nullable: false })
  rollNo: number;
}
