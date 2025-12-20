import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PendingAttendanceOutputPartial {
  @Field()
  date: Date;

  @Field(() => [String])
  schedule: string[];
}

@ObjectType()
export class PendingAttendanceOutput {
  @Field(() => [PendingAttendanceOutputPartial])
  pendingUpdates: PendingAttendanceOutputPartial[];
}
