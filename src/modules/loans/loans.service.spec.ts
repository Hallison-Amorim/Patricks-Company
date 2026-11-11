import { BadRequestException } from '@nestjs/common';
import { CatalogService } from '../catalog/catalog.service';
import { LoansService } from './loans.service';

describe('LoansService', () => {
  it('creates a loan with a 14-day due date and locks the equipment', () => {
    const catalog = new CatalogService(); const service = new LoansService(catalog);
    const loan = service.request('TI-0001');
    expect(loan.equipmentId).toBe('TI-0001');
    expect(catalog.find('TI-0001')?.status).toBe('loaned');
  });
  it('rejects a fourth simultaneous loan', () => {
    const catalog = new CatalogService(); const service = new LoansService(catalog);
    service.request('TI-0001'); service.request('TI-0002'); service.request('TI-0003');
    expect(() => service.request('TI-0005')).toThrow(BadRequestException);
  });
});
