import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Week } from 'src/entities/week.entity';
import { Repository } from 'typeorm';
import { createWeekTimeTableDto } from './dto/createWeekTimeTable.dto';
import { editWeekTimeTableDto } from './dto/editWeekTimeTable.dto';
import { waitForDebugger } from 'inspector';
import { ObjectId } from 'mongodb';

@Injectable()
export class WeekService {
  constructor(
    @InjectRepository(Week) private weekRepository: Repository<Week>,
  ) {}

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
    try {
      await this.weekRepository.update(new ObjectId(input.id), {
        timeTable: input.timeTable,
      });

      const weeks = await this.weekRepository.find();
      let week;
      weeks.map((w) => {
        if (String(w.id) === input.id) {
          week = w;
        }
      });
      return week;
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  async deleteWeekTimeTable(id: string) {
    try {
      console.log(id);
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
