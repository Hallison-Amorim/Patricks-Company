import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { defer, Observable } from 'rxjs';
import { AuthContextService } from './auth-context.service';
import { AuthenticatedRequest } from './supabase-auth.guard';

@Injectable()
export class AuthContextInterceptor implements NestInterceptor {
  constructor(private readonly context: AuthContextService) {}

  intercept(executionContext: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = executionContext.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.auth) return next.handle();
    return defer(() => this.context.run(request.auth!, () => next.handle()));
  }
}
