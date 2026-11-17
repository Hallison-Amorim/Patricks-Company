import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import type { LoanRequestContext } from '../loans/loans.service';

@Injectable()
export class SupabaseAuthService {
  constructor(private readonly prisma: PrismaService) {}

  async authenticate(authorization?: string): Promise<LoanRequestContext> {
    const token = this.readBearerToken(authorization);
    const client = createClient(this.requiredEnv('SUPABASE_URL'), this.requiredEnv('SUPABASE_ANON_KEY'), {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) throw new UnauthorizedException('Token de acesso inválido.');

    const profile = await this.prisma.profile.findUnique({
      where: { id: data.user.id },
      select: { tenantId: true },
    });
    if (!profile) throw new UnauthorizedException('Usuário sem perfil de acesso.');

    return { userId: data.user.id, tenantId: profile.tenantId };
  }

  private readBearerToken(authorization?: string): string {
    const [scheme, token] = authorization?.split(' ') ?? [];
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Token Bearer obrigatório.');
    }
    return token;
  }

  private requiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) throw new UnauthorizedException(`Configuração ${name} ausente.`);
    return value;
  }
}
