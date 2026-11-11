import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { LoansController } from './loans.controller';
import { LoansService } from './loans.service';
@Module({ imports: [CatalogModule], controllers: [LoansController], providers: [LoansService] })
export class LoansModule {}
