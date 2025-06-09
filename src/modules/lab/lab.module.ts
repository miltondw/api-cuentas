import { Module } from '@nestjs/common';
import { ApiquesModule } from './apiques/apiques.module';
import { ProfilesModule } from './profiles/profiles.module';

@Module({
  imports: [ApiquesModule, ProfilesModule],
  exports: [ApiquesModule, ProfilesModule],
})
export class LabModule {}
