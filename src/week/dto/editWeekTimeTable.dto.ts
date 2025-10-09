import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';
import { SaturdayTT } from 'src/enums/saturday.tt';

@InputType()
export class editWeekTimeTableDto {
  @Field()
  @IsNotEmpty()
  id: string;

  @Field()
  @IsNotEmpty()
  saturdayStatus: SaturdayTT;

  @Field(() => [String])
  @IsNotEmpty()
  timeTable: string[];
}
