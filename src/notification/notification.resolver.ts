import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { NotificationService } from './notification.service';
import { UseGuards } from '@nestjs/common';
import { GqlJwtAuthGuard } from 'src/auth/guard/jwt_token.guard';

@Resolver()
export class NotificationResolver {
  constructor(private notificationService: NotificationService) {}

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => Boolean)
  updatePushNotificationToken(
    @Args('notificationToken') notificationToken: string,
    @Args('rollNo') rollNo: number,
  ) {
    return this.notificationService.updatePushNotificationToken(
      notificationToken,
      rollNo,
    );
  }

  @Mutation(() => Boolean)
  async markAttendanceFromNotification(@Args('actionId') actionId: string) {
    try {
      await this.notificationService.markAttendanceFromNotification(actionId);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  @Query(() => String)
  sendMarkAttendanceNotification() {
    this.notificationService.sendMarkAttendanceNotification();
    return 'Done';
  }
}
