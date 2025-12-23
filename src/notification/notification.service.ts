import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'mongodb';
import { NotificationAction } from 'src/entities/notification_action.entity';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

type NotificationPayload = {
  to: string;
  priority: string;
  data: {
    actionId: ObjectId;
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
    private notificationActionRepository: Repository<NotificationAction>,
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

  async sendMarkAttendanceNotification() {
    const users = await this.userRepository.find();
    let payload: NotificationPayload[] = [];
    for (const user of users) {
      if (user.notificationToken) {
        const action = {
          rollNo: user.rollNo,
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
            actionId: savedAction.id,
            title: 'Mark your attendance',
            categoryId: 'attendance_actions',
            body: 'Did you attend all the classes today?',
          },
        };
        payload.push(notificationPayload);
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
