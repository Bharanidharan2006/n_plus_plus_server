import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AttendanceService } from './attendance.service';
import { UseGuards } from '@nestjs/common';
import { GqlJwtAuthGuard } from 'src/auth/guard/jwt_token.guard';
import { UpdateAttendanceDto } from './dto/updateAttendance.dto';
import { GetAttendancePercentageOutput } from './dto/attendancePercentage.dto';
import { Subject } from 'src/entities/subject.entity';
import { Attendance } from 'src/entities/attendance.entity';

@Resolver()
@UseGuards(GqlJwtAuthGuard)
export class AttendanceResolver {
  constructor(private attendanceService: AttendanceService) {}

  @Query(() => [Subject])
  getSubjectDetails() {
    return this.attendanceService.getSubjectDetails();
  }

  @Query(() => Attendance)
  getAttendanceRecord(
    @Args('rollNo') rollNo: number,
    @Args('subjectId') subjectId: string,
  ) {
    return this.attendanceService.getAttendanceRecord(rollNo, subjectId);
  }

  @Query(() => [GetAttendancePercentageOutput])
  getAttendancePercentage(@Args('rollNo') rollNo: number) {
    return this.attendanceService.getAttendancePercentage(rollNo);
  }

  @Mutation(() => Boolean)
  async updateAttendance(@Args('input') input: UpdateAttendanceDto) {
    return await this.attendanceService.updateAttendance(input);
  }
}
