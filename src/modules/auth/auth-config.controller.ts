import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';

/**
 * Entrega somente a configuração pública necessária para inicializar o SDK
 * do Supabase no navegador. A chave anon é própria para clientes públicos;
 * credenciais de serviço nunca passam por este endpoint.
 */
@Controller('auth')
export class AuthConfigController {
  @Get('config')
  getPublicConfig(): { supabaseUrl: string; supabaseAnonKey: string } {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new ServiceUnavailableException('Configuração de autenticação indisponível.');
    }

    return { supabaseUrl, supabaseAnonKey };
  }
}
