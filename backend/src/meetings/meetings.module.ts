import { Module } from '@nestjs/common';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';
import { DiscussionsController } from './discussions.controller';
import { DiscussionsService } from './discussions.service';

@Module({
  controllers: [MeetingsController, DiscussionsController],
  providers: [MeetingsService, DiscussionsService],
  exports: [MeetingsService, DiscussionsService],
})
export class MeetingsModule {}
