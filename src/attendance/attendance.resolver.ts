import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AttendanceService } from './attendance.service';
import { UseGuards } from '@nestjs/common';
import { GqlJwtAuthGuard } from 'src/auth/guard/jwt_token.guard';
import { UpdateAttendanceDto } from './dto/updateAttendance.dto';

@Resolver()
//@UseGuards(GqlJwtAuthGuard)
export class AttendanceResolver {
  constructor(private attendanceService: AttendanceService) {}

  //Remove this after testing

  @Mutation(() => Boolean)
  async updateAttendance(@Args('input') input: UpdateAttendanceDto) {
    return await this.attendanceService.updateAttendance(input);
  }
}
