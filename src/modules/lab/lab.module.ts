import { Module } from '@nestjs/common';
import { ApiquesModule } from './apiques/apiques.module';
import { ProfilesModule } from './profiles/profiles.module';
import { LabProjectsModule } from './lab-projects/lab-projects.module';

@Module({
  imports: [ApiquesModule, ProfilesModule, LabProjectsModule],
  exports: [ApiquesModule, ProfilesModule, LabProjectsModule],
})
export class LabModule {}
