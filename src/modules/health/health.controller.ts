import { Controller, Get, Inject } from "@nestjs/common";

import { HealthPayload, HealthService } from "./health.service";

/**
 * Rotas explícitas em quatro caminhos porque a function da Vercel pode
 * repassar o caminho original (/ , /api/health) ou o caminho de destino
 * do rewrite (/api, /api/index). Sem curinga: evita depender da sintaxe
 * de rota do Express 5.
 */
@Controller()
export class HealthController {
  constructor(
    @Inject(HealthService)
    private readonly healthService: HealthService,
  ) {}

  @Get()
  getRoot(): HealthPayload {
    return this.healthService.getHealth();
  }

  @Get("api")
  getApiRoot(): HealthPayload {
    return this.healthService.getHealth();
  }

  @Get("health")
  getHealth(): HealthPayload {
    return this.healthService.getHealth();
  }

  @Get("api/health")
  getApiHealth(): HealthPayload {
    return this.healthService.getHealth();
  }
}
