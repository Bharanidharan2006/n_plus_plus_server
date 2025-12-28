import { forwardRef, Module } from '@nestjs/common';
import { WeekService } from './week.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Week } from 'src/entities/week.entity';
import { WeekResolver } from './week.resolver';
import { AuthService } from 'src/auth/auth.service';
import { User } from 'src/entities/user.entity';
import { AttendanceService } from 'src/attendance/attendance.service';
import { Attendance } from 'src/entities/attendance.entity';
import { Subject } from 'src/entities/subject.entity';
import { CronStatus } from 'src/entities/cron_status.entity';
import { AttendanceModule } from 'src/attendance/attendance.module';

// --- This module should only be accessed by reps -----
// 1. Reps can create a timetable for each week by clicking create which gives the default timetable and they can edit any classed that have changed for that week. Then they can send "CreateWeek" mutation;
// 2. They can edit classes if any changes are to be made later using "editWeek" mutation;
// 3. getAllWeeks() -> returns all the weeks created so far
// 4. getLatestWeek() -> returns the ongoing week( week with the highest week no ); + This function is called by methods in the user module to get the ongoing week data;
// 5. deleteWeek -> it only allows the deletion of the latest week. ***Should find a way to add a undo option to this delete method***

@Module({
  imports: [
    TypeOrmModule.forFeature([Week, User, Attendance, Subject, CronStatus]),
    forwardRef(() => AttendanceModule),
  ],
  providers: [WeekService, WeekResolver, AuthService, AttendanceService],
  exports: [WeekService],
})
export class WeekModule {}
