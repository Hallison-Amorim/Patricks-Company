import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";

describe("HealthController", () => {
  const controller = new HealthController(new HealthService());

  it("returns an ok payload on /", () => {
    const payload = controller.getRoot();

    expect(payload.status).toBe("ok");
    expect(payload.service).toBe("emprest-ai-api");
    expect(typeof payload.timestamp).toBe("string");
    expect(typeof payload.uptimeSeconds).toBe("number");
  });

  it("exposes the same service payload on every health route", () => {
    const payloads = [
      controller.getApiRoot(),
      controller.getHealth(),
      controller.getApiHealth(),
    ];

    for (const payload of payloads) {
      expect(payload.status).toBe("ok");
      expect(payload.service).toBe("emprest-ai-api");
      expect(typeof payload.version).toBe("string");
      expect(Number.isNaN(Date.parse(payload.timestamp))).toBe(false);
      expect(typeof payload.uptimeSeconds).toBe("number");
    }
  });
});
