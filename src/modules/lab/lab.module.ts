import { Module } from '@nestjs/common';
import { ApiquesModule } from '@/modules/lab/apiques/apiques.module';
import { ProfilesModule } from '@/modules/lab/profiles/profiles.module';
import { LabProjectsModule } from '@/modules/lab/lab-projects/lab-projects.module';

@Module({
  imports: [ApiquesModule, ProfilesModule, LabProjectsModule],
  exports: [ApiquesModule, ProfilesModule, LabProjectsModule],
})
export class LabModule {}
