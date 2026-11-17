import { Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthContextInterceptor } from '../auth/auth-context.interceptor';
import { AuthContextService } from '../auth/auth-context.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CatalogService, Equipment } from './catalog.service';

@Controller('catalog')
@UseGuards(SupabaseAuthGuard)
@UseInterceptors(AuthContextInterceptor)
export class CatalogController {
  constructor(
    private readonly catalog: CatalogService,
    private readonly authContext: AuthContextService,
  ) {}
  @Get() list(): Promise<Equipment[]> { return this.catalog.list(this.authContext.require()); }
}
