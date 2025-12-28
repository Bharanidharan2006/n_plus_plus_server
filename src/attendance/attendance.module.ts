import { forwardRef, Module } from '@nestjs/common';
import { AttendanceResolver } from './attendance.resolver';
import { AttendanceService } from './attendance.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Attendance } from 'src/entities/attendance.entity';
import { Week } from 'src/entities/week.entity';
import { WeekService } from 'src/week/week.service';
import { Subject } from 'src/entities/subject.entity';
import { CronStatus } from 'src/entities/cron_status.entity';
import { WeekModule } from 'src/week/week.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Week, Attendance, Subject, CronStatus]),
    forwardRef(() => WeekModule),
  ],
  providers: [AttendanceResolver, AttendanceService, WeekService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
