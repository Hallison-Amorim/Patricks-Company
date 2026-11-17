import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CatalogModule } from '../catalog/catalog.module';
import { LoansController } from './loans.controller';
import { LoansRepository } from './loans.repository';
import { LoansService } from './loans.service';
@Module({
  imports: [AuthModule, CatalogModule],
  controllers: [LoansController],
  providers: [LoansRepository, LoansService],
})
export class LoansModule {}
