import {
  Field,
  GraphQLISODateTime,
  Int,
  ObjectType,
  ResolveField,
} from '@nestjs/graphql';
import { SaturdayTT } from 'src/enums/saturday.tt';
import {
  Entity,
  ObjectIdColumn,
  Column,
  ObjectId,
  CreateDateColumn,
} from 'typeorm';

@ObjectType()
@Entity()
export class Week {
  @Field((type) => String)
  @ObjectIdColumn()
  id: ObjectId;

  @Field((type) => Int)
  @Column()
  weekNo: number;

  @Field({ nullable: false })
  @Column()
  startDate: Date;

  @Field({ nullable: false })
  @Column()
  endDate: Date;

  @Field((type) => [String])
  @Column()
  timeTable: string[];

  @Field({ nullable: false })
  @Column({
    type: 'enum',
    enum: SaturdayTT,
    default: SaturdayTT.Leave,
  })
  saturdayStatus: SaturdayTT;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  @Field(() => GraphQLISODateTime, { nullable: true })
  createdAt: Date;
}
