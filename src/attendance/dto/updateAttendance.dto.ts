import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@InputType()
class IndividualRecord {
  @Field(() => Int)
  rollNo: number;

  @Field(() => [Boolean])
  attended: boolean[];
}

@InputType()
export class UpdateAttendanceDto {
  @Field()
  @IsNotEmpty()
  subjectCode: string;

  @Field()
  @IsNotEmpty()
  date: Date;

  @Field(() => [Int])
  @IsNotEmpty()
  periods: number[];

  @Field(() => [IndividualRecord])
  @IsNotEmpty()
  attendanceData: IndividualRecord[];
}
