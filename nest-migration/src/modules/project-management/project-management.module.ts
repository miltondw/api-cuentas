import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { FinancialModule } from '../financial/financial.module';

@Module({
  imports: [ProjectsModule, FinancialModule],
  exports: [ProjectsModule, FinancialModule],
})
export class ProjectManagementModule {}
