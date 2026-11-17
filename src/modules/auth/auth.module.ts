import { Module } from '@nestjs/common';
import { AuthContextInterceptor } from './auth-context.interceptor';
import { AuthContextService } from './auth-context.service';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { SupabaseAuthService } from './supabase-auth.service';

@Module({
  providers: [AuthContextService, AuthContextInterceptor, SupabaseAuthGuard, SupabaseAuthService],
  exports: [AuthContextInterceptor, AuthContextService, SupabaseAuthGuard],
})
export class AuthModule {}
