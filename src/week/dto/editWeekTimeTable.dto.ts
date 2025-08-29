import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@InputType()
export class editWeekTimeTableDto {
  @Field()
  @IsNotEmpty()
  id: string;

  @Field(() => [String])
  @IsNotEmpty()
  timeTable: string[];
}
