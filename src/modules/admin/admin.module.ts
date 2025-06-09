import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PDFModule } from '../pdf/pdf.module';

@Module({
  imports: [AuthModule, PDFModule],
  exports: [AuthModule, PDFModule],
})
export class AdminModule {}
