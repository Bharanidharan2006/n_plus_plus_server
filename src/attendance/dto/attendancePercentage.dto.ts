import { Field, ObjectType } from '@nestjs/graphql';
import { Attendance } from 'src/entities/attendance.entity';
import { Subject } from 'src/entities/subject.entity';

@ObjectType()
export class GetAttendancePercentageOutput {
  @Field(() => Attendance)
  attendance: Attendance;

  @Field(() => Subject)
  subjectDetails: Subject;
}
