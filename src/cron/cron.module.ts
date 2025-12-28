import { Module } from '@nestjs/common';
import { CronResolver } from './cron.resolver';
import { CronService } from './cron.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CronStatus } from 'src/entities/cron_status.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CronStatus])],
  providers: [CronResolver, CronService],
})
export class CronModule {}
