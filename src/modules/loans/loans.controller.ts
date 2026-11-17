import { Controller, Get, Param, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthContextInterceptor } from '../auth/auth-context.interceptor';
import { AuthContextService } from '../auth/auth-context.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { LoansService } from './loans.service';
@Controller('loans')
@UseGuards(SupabaseAuthGuard)
@UseInterceptors(AuthContextInterceptor)
export class LoansController {
  constructor(
    private readonly loans: LoansService,
    private readonly authContext: AuthContextService,
  ) {}

  @Get() list() {
    return this.loans.list(this.authContext.require());
  }

  @Post(':equipmentId') request(@Param('equipmentId') equipmentId: string) {
    return this.loans.request(this.authContext.require(), equipmentId);
  }
}
