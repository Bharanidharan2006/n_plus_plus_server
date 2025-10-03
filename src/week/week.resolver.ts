import { Args, Int, Mutation, Resolver } from '@nestjs/graphql';
import { WeekService } from './week.service';
import { Query } from '@nestjs/graphql';
import { Week } from 'src/entities/week.entity';
import { createWeekTimeTableDto } from './dto/createWeekTimeTable.dto';
import { editWeekTimeTableDto } from './dto/editWeekTimeTable.dto';
import { UseGuards } from '@nestjs/common';
import { RepAccessGuard } from 'src/auth/guard/rep_access.guard';
import { GqlJwtAuthGuard } from 'src/auth/guard/jwt_token.guard';

// Ref week.module.ts for docs

@Resolver(() => Week)
export class WeekResolver {
  constructor(private weekService: WeekService) {}

  @Query(() => Int)
  methoddd() {
    this.weekService.updateTimeTable();
    return 5;
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [Week])
  async getAllWeeks(): Promise<Week[]> {
    return this.weekService.getAllWeeks();
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => Week)
  getLatestWeek(): Promise<Week> {
    return this.weekService.getLatestWeek();
  }

  @Mutation((returns) => Week)
  createWeekTimeTable(@Args('input') input: createWeekTimeTableDto) {
    return this.weekService.createWeekTimeTable(input);
  }

  @UseGuards(GqlJwtAuthGuard, RepAccessGuard)
  @Mutation((returns) => Week)
  editWeekTimeTable(@Args('input') input: editWeekTimeTableDto) {
    return this.weekService.editWeekTimeTable(input);
  }

  @UseGuards(GqlJwtAuthGuard, RepAccessGuard)
  @Mutation((returns) => String)
  deleteWeekTimeTable(@Args('id') id: string) {
    return this.weekService.deleteWeekTimeTable(id);
  }
}
