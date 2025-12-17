import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
class PendingAttendanceOutputPartial {
  @Field()
  date: Date;

  @Field()
  schedule: string[];
}

@ObjectType()
export class PendingAttendanceOutput {
  pendingUpdates: PendingAttendanceOutputPartial[];
}
