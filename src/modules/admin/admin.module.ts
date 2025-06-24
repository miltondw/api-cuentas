import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { PDFModule } from '@/modules/pdf/pdf.module';

@Module({
  imports: [AuthModule, PDFModule],
  exports: [AuthModule, PDFModule],
})
export class AdminModule {}
