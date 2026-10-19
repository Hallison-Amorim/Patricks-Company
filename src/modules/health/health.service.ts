import { Injectable } from "@nestjs/common";

export interface HealthPayload {
  status: "ok";
  service: string;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
}

@Injectable()
export class HealthService {
  getHealth(): HealthPayload {
    return {
      status: "ok",
      service: "emprest-ai-api",
      version: process.env.npm_package_version ?? "0.1.0",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    };
  }
}
