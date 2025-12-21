import { Module } from '@nestjs/common';
import { NotificationResolver } from './notification.resolver';
import { NotificationService } from './notification.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Attendance } from 'src/entities/attendance.entity';
import { NotificationAction } from 'src/entities/notification_action.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Attendance, NotificationAction])],
  providers: [NotificationResolver, NotificationService],
})
export class NotificationModule {}
