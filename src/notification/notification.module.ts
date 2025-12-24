import { Module } from '@nestjs/common';
import { NotificationResolver } from './notification.resolver';
import { NotificationService } from './notification.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Attendance } from 'src/entities/attendance.entity';
import { NotificationAction } from 'src/entities/notification_action.entity';
import { AttendanceService } from 'src/attendance/attendance.service';
import { Subject } from 'src/entities/subject.entity';
import { Semester } from 'src/entities/semester.entity';
import { WeekService } from 'src/week/week.service';
import { Week } from 'src/entities/week.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Attendance,
      NotificationAction,
      Subject,
      Semester,
      Week,
    ]),
  ],
  providers: [
    NotificationResolver,
    NotificationService,
    AttendanceService,
    WeekService,
  ],
})
export class NotificationModule {}
