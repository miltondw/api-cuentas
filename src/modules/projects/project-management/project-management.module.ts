import { Module } from '@nestjs/common';
import { ProjectsModule } from '@/modules/projects/projects.module';
import { FinancialModule } from '@/modules/projects/financial/financial.module';

@Module({
  imports: [ProjectsModule, FinancialModule],
  exports: [ProjectsModule, FinancialModule],
})
export class ProjectManagementModule {}
