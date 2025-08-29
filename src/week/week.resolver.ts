import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { WeekService } from './week.service';
import { Query } from '@nestjs/graphql';
import { Week } from 'src/entities/week.entity';
import { createWeekTimeTableDto } from './dto/createWeekTimeTable.dto';
import { editWeekTimeTableDto } from './dto/editWeekTimeTable.dto';

// Ref week.module.ts for docs

@Resolver(() => Week)
export class WeekResolver {
  constructor(private weekService: WeekService) {}

  @Query(() => [Week])
  async getAllWeeks(): Promise<Week[]> {
    return this.weekService.getAllWeeks();
  }

  @Query(() => Week)
  getLatestWeek(): Promise<Week> {
    return this.weekService.getLatestWeek();
  }

  @Mutation((returns) => Week)
  createWeekTimeTable(@Args('input') input: createWeekTimeTableDto) {
    return this.weekService.createWeekTimeTable(input);
  }

  @Mutation((returns) => Week)
  editWeekTimeTable(@Args('input') input: editWeekTimeTableDto) {
    return this.weekService.editWeekTimeTable(input);
  }

  @Mutation((returns) => String)
  deleteWeekTimeTable(@Args('id') id: string) {
    return this.weekService.deleteWeekTimeTable(id);
  }
}
