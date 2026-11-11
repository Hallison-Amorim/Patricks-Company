import { Controller, Get } from '@nestjs/common';
import { CatalogService, Equipment } from './catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}
  @Get() list(): Promise<Equipment[]> { return this.catalog.list(); }
}
