import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';
import { SaturdayTT } from 'src/enums/saturday.tt';

@InputType()
export class createWeekTimeTableDto {
  @Field()
  @IsNotEmpty()
  startDate: Date;
  @Field()
  @IsNotEmpty()
  endDate: Date;
  @Field(() => [String])
  @IsNotEmpty()
  timeTable: string[];
  @Field()
  @IsNotEmpty()
  saturdayStatus: SaturdayTT;
  @Field()
  @IsNotEmpty()
  weekNo: number;
}
