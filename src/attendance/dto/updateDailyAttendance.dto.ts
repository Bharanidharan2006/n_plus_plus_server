import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@InputType()
export class UpdateDailyAttendanceDto {
  @Field()
  @IsNotEmpty()
  date: Date;

  @Field()
  @IsNotEmpty()
  rollno: number;

  @Field(() => [Boolean])
  @IsNotEmpty()
  attendanceData: boolean[];
}
