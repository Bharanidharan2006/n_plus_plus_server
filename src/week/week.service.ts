import {
  BadRequestException,
  forwardRef,
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Week } from 'src/entities/week.entity';
import { Repository } from 'typeorm';
import { createWeekTimeTableDto } from './dto/createWeekTimeTable.dto';
import { editWeekTimeTableDto } from './dto/editWeekTimeTable.dto';
import { ObjectId } from 'mongodb';
import { Cron, CronExpression } from '@nestjs/schedule';
import timetable from './timetable.json';
import { SaturdayTT } from 'src/enums/saturday.tt';
import { AttendanceService } from 'src/attendance/attendance.service';

@Injectable()
export class WeekService {
  constructor(
    @Inject(forwardRef(() => AttendanceService))
    private attendanceService: AttendanceService,
    @InjectRepository(Week) private weekRepository: Repository<Week>,
  ) {}

  // CRON that creates timetable from a default timetable every sunday night
  @Cron(CronExpression.EVERY_WEEK, { timeZone: 'Asia/Kolkata' })
  async updateTimeTable() {
    const startDate = new Date();
    const endDate = new Date();
    const latestWeek = await this.getLatestWeek();
    endDate.setDate(startDate.getDate() + 7); //
    const newWeek = {
      startDate: startDate,
      endDate: endDate,
      weekNo: latestWeek.weekNo + 1,
      saturdayStatus: SaturdayTT.Leave,
      timeTable: timetable.timetable,
    };
    await this.weekRepository.save(newWeek);
  }

  // ------- Methods handling QUERIES -----------

  async getAllWeeks() {
    try {
      return await this.weekRepository.find();
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  // This method is to be used by user methods to get the latest week so that users can update their attendance
  async getLatestWeek() {
    try {
      let weeks = await this.weekRepository.find({ order: { weekNo: 'DESC' } });
      return weeks[0];
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  // ------- Methods handling MUTATIONS -----------

  async createWeekTimeTable(week: createWeekTimeTableDto): Promise<Week> {
    const newWeek = {
      startDate: week.startDate,
      endDate: week.endDate,
      weekNo: week.weekNo,
      saturdayStatus: week.saturdayStatus,
      timeTable: week.timeTable,
    };

    try {
      return await this.weekRepository.save(newWeek);
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  // check if it throws an error if the week doesn't exist -> the update function doesn't check wether the entity exists or not;
  async editWeekTimeTable(input: editWeekTimeTableDto) {
    //Done this because reps can edit only the latest week
    const unChangedWeekTimeTable = (await this.getLatestWeek()).timeTable;

    try {
      await this.weekRepository.update(new ObjectId(input.id), {
        timeTable: input.timeTable,
      });

      const weeks = await this.weekRepository.find();
      let week;
      weeks.map((w) => {
        if (String(w.id) === input.id) {
          // If you convert input.id to ObjectId it doesn't work
          week = w;
        }
      });

      const changedWeekTimeTable = week.timeTable;
      let changedIndex = -1;
      unChangedWeekTimeTable.forEach((val, idx) => {
        if (val !== changedWeekTimeTable[idx]) {
          changedIndex = idx;
        }
      });

      if (changedIndex !== -1) {
        const dayNo = changedIndex / 8 + 1;
        const todayDayNo = new Date().getDay() - 1;

        if (dayNo === todayDayNo) {
          this.attendanceService.updateAttendanceCron(true);
        }
      }

      return week;
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  async deleteWeekTimeTable(id: string) {
    try {
      const weeks = await this.weekRepository.find({
        order: { weekNo: 'DESC' },
      });
      if (id === String(weeks[0].id)) {
        await this.weekRepository.delete(id);
        return 'Deleted Successfully';
      } else {
        throw new BadRequestException('Only the lastest week can be deleted.');
      }
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }
}
