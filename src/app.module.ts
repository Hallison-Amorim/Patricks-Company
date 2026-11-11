import { Module } from "@nestjs/common";

import { HealthModule } from "./modules/health/health.module";
import { CatalogModule } from './modules/catalog/catalog.module';
import { LoansModule } from './modules/loans/loans.module';
import { PrismaModule } from './modules/prisma/prisma.module';

@Module({
  imports: [PrismaModule, HealthModule, CatalogModule, LoansModule],
})
export class AppModule {}
