import { Module } from '@nestjs/common';
import { AuthContextInterceptor } from './auth-context.interceptor';
import { AuthContextService } from './auth-context.service';
import { AuthConfigController } from './auth-config.controller';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { SupabaseAuthService } from './supabase-auth.service';

@Module({
  controllers: [AuthConfigController],
  providers: [AuthContextService, AuthContextInterceptor, SupabaseAuthGuard, SupabaseAuthService],
  exports: [AuthContextInterceptor, AuthContextService, SupabaseAuthGuard],
})
export class AuthModule {}
