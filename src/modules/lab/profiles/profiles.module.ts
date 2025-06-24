import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfilesService } from '@/modules/lab/profiles/profiles.service';
import { ProfilesController } from '@/modules/lab/profiles/profiles.controller';
import { Profile } from '@/modules/lab/profiles/entities/profile.entity';
import { Blow } from '@/modules/lab/profiles/entities/blow.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Profile, Blow])],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
