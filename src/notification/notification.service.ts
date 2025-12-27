import { forwardRef, HttpException, Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'mongodb';
import { AttendanceService } from 'src/attendance/attendance.service';
import { NotificationAction } from 'src/entities/notification_action.entity';
import { Semester } from 'src/entities/semester.entity';
import { Subject } from 'src/entities/subject.entity';
import { User } from 'src/entities/user.entity';
import { Week } from 'src/entities/week.entity';
import { SaturdayTT } from 'src/enums/saturday.tt';
import { MongoRepository, Repository } from 'typeorm';

type NotificationPayload = {
  to: string;
  priority: string;
  data: {
    actionId: string;
    title: string;
    categoryId: string;
    body: string;
  };
};

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(NotificationAction)
    private notificationActionRepository: MongoRepository<NotificationAction>,
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
    @InjectRepository(Semester)
    private semesterRepository: Repository<Semester>,
    @InjectRepository(Week)
    private weekRepository: Repository<Week>,
    @Inject(forwardRef(() => AttendanceService))
    private attendanceService: AttendanceService,
  ) {}

  async updatePushNotificationToken(notificationToken: string, rollNo: number) {
    const user = await this.userRepository.findOne({
      where: { rollNo: rollNo },
    });

    if (!user) {
      throw new HttpException('User with the given rollno is not found!', 404);
    }

    user.notificationToken = notificationToken;

    try {
      await this.userRepository.save(user);
      return true;
    } catch (e) {
      throw new HttpException(e, 500);
    }
  }

  async markAttendanceFromNotification(actionId: string) {
    const notificationAction =
      await this.notificationActionRepository.findOneById(actionId);

    if (!notificationAction)
      throw new HttpException(
        'Notification with the given action id is never registered or expired',
        404,
      );

    if (!notificationAction.isUpdated) {
      try {
        await this.attendanceService.updateDailyAttendance({
          rollNo: notificationAction.rollNo,
          date: notificationAction.date,
          attendanceData: Array(8).fill(true),
        });
        notificationAction.isUpdated = true;
        await this.notificationActionRepository.save(notificationAction);
      } catch (e) {
        throw new HttpException(e, 500);
      }
    }
  }

  // Cron test

  // @Cron('*/10 * * * * *')
  // handleTestCron() {
  //   console.log('CRON RUNNING:', new Date().toISOString());
  // }

  // Sends the notification at 6 pm everyday(Cron to be added) to all users. Need to be headless so body is omitted and placed inside data

  @Cron('0 18 * * 1-6', {
    timeZone: 'Asia/Kolkata',
  })
  async sendMarkAttendanceNotification() {
    const todayDayNo = new Date().getDay();
    const users = await this.userRepository.find();
    let week = (
      await this.weekRepository.find({ order: { weekNo: 'DESC' } })
    )[0];
    if (week.saturdayStatus === SaturdayTT.Leave && todayDayNo === 6) return;
    const schedule = this.attendanceService.getScheduleByDate(new Date());
    let todayIsHoliday = false;
    for (const period of week.timeTable) {
      if (period !== '') {
        todayIsHoliday = true;
      }
    }

    if (todayIsHoliday) return;

    let payload: NotificationPayload[] = [];
    for (const user of users) {
      console.log('Send notifications');

      if (user.notificationToken) {
        const action = {
          rollNo: user.rollNo,
          date: new Date(),
          isUpdated: false,
        };
        const savedAction =
          await this.notificationActionRepository.save(action);
        if (!savedAction) {
          throw new HttpException(
            'Could not store the notification action',
            500,
          );
        }
        const notificationPayload = {
          to: user.notificationToken,
          priority: 'high',
          data: {
            actionId: savedAction.id.toString(),
            title: 'Mark your attendance',
            categoryId: 'attendance_actions',
            body: 'Did you attend all the classes today?',
          },
        };
        payload.push(notificationPayload);
        user.pendingDates.push(new Date());
        await this.userRepository.save(user);
      }
    }

    const headers = {
      Host: 'exp.host',
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    };

    fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  }
}
