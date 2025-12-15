import { ApolloDriver } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AuthModule } from 'src/auth/auth.module';
import { User } from 'src/entities/user.entity';
import { Week } from 'src/entities/week.entity';
import { WeekModule } from 'src/week/week.module';
import * as dotenv from 'dotenv';
import { AttendanceModule } from 'src/attendance/attendance.module';
import { Subject } from 'src/entities/subject.entity';
import { Semester } from 'src/entities/semester.entity';
import { Attendance } from 'src/entities/attendance.entity';
import { ScheduleModule } from '@nestjs/schedule';

dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mongodb',
      url: process.env.DATABASE_URL,
      entities: [Week, User, Subject, Semester, Attendance],
      synchronize: true,
    }),
    GraphQLModule.forRoot({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: true,
    }),
    ScheduleModule.forRoot(),
    WeekModule,
    AuthModule,
    AttendanceModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
