import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { SupabaseAuthService } from './supabase-auth.service';

export type AuthenticatedRequest = { headers: Record<string, string | string[] | undefined>; auth?: { userId: string; tenantId: string } };

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly auth: SupabaseAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = Array.isArray(request.headers.authorization)
      ? request.headers.authorization[0]
      : request.headers.authorization;
    request.auth = await this.auth.authenticate(authorization);
    return true;
  }
}
