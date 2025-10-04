import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongodb';
import { Column, Entity, ObjectIdColumn } from 'typeorm';

@ObjectType()
export class AttendanceRecord {
  @Field()
  @Column()
  date: Date;

  @Field(() => [Int])
  @Column()
  periods: number[];

  @Field()
  @Column()
  monthNumber: number;

  @Field(() => Boolean)
  @Column({ default: false })
  isUpdated: boolean;

  @Field(() => [Boolean])
  @Column()
  attended: boolean[];
}

@ObjectType()
@Entity()
export class Attendance {
  @Field(() => String)
  @ObjectIdColumn()
  id: ObjectId;

  @Field(() => String)
  @Column()
  semesterId: ObjectId;

  @Field(() => Int)
  @Column()
  studentRollNo: number;

  @Field(() => String)
  @Column()
  subjectId: ObjectId;

  @Field()
  @Column({ default: 0 })
  totalContactHours: number;

  @Field()
  @Column({ default: 0 })
  attendedContactHours: number;

  @Field()
  @Column({ default: 0 })
  attendancePercentage: number;

  @Field(() => [AttendanceRecord])
  @Column((type) => AttendanceRecord)
  attendanceRecords: AttendanceRecord[];
}
