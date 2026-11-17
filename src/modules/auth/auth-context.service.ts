import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { LoanRequestContext } from '../loans/loans.service';

@Injectable()
export class AuthContextService {
  private readonly storage = new AsyncLocalStorage<LoanRequestContext>();

  run<T>(context: LoanRequestContext, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  require(): LoanRequestContext {
    const context = this.storage.getStore();
    if (!context) throw new UnauthorizedException('Contexto de autenticação ausente.');
    return context;
  }
}
