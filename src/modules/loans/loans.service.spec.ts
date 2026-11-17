import { BadRequestException } from '@nestjs/common';
import { EquipmentStatus } from '@prisma/client';
import { LoansRepository } from './loans.repository';
import { addBusinessDays, LoansService } from './loans.service';

function repositoryStub(overrides: Partial<Record<keyof LoansRepository, unknown>> = {}) {
  return {
    transaction: async <T>(operation: (db: never) => Promise<T>): Promise<T> => operation(undefined as never),
    findProfile: jest.fn().mockResolvedValue({ id: 'user-1', tenantId: 'tenant-1' }),
    hasOverdueLoan: jest.fn().mockResolvedValue(false),
    countOpenLoans: jest.fn().mockResolvedValue(0),
    findEquipment: jest.fn().mockResolvedValue({ id: 'equipment-1', status: EquipmentStatus.available }),
    markLoaned: jest.fn().mockResolvedValue(1),
    createLoan: jest.fn().mockResolvedValue({
      id: 'loan-1',
      dueAt: new Date(Date.UTC(2026, 10, 20)),
      equipment: { assetTag: 'TI-0001', name: 'Notebook 14 polegadas' },
    }),
    listOpenLoans: jest.fn().mockResolvedValue([]),
    ...overrides,
  } as unknown as LoansRepository;
}

describe('addBusinessDays', () => {
  it('skips weekends when calculating the due date', () => {
    const friday = new Date(Date.UTC(2026, 10, 6));
    expect(addBusinessDays(friday, 1).toISOString().slice(0, 10)).toBe('2026-11-09');
  });

  it('calculates fourteen business days from a weekday', () => {
    const monday = new Date(Date.UTC(2026, 10, 2));
    expect(addBusinessDays(monday, 14).toISOString().slice(0, 10)).toBe('2026-11-20');
  });
});

describe('LoansService', () => {
  const context = { tenantId: 'tenant-1', userId: 'user-1' };

  it('persists an available item with a fourteen-business-day due date', async () => {
    const repository = repositoryStub();
    const service = new LoansService(repository);

    const loan = await service.request(context, 'TI-0001', new Date(Date.UTC(2026, 10, 2)));

    expect(loan.equipmentId).toBe('TI-0001');
    expect(loan.dueAt).toBe('2026-11-20');
    expect(repository.markLoaned).toHaveBeenCalledWith(undefined, 'equipment-1');
    expect(repository.createLoan).toHaveBeenCalledWith(undefined, expect.objectContaining({ dueAt: new Date(Date.UTC(2026, 10, 20)) }));
  });

  it('rejects a sixth open loan', async () => {
    const service = new LoansService(repositoryStub({ countOpenLoans: jest.fn().mockResolvedValue(5) }));

    await expect(service.request(context, 'TI-0001')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects requests while the borrower has an overdue loan', async () => {
    const service = new LoansService(repositoryStub({ hasOverdueLoan: jest.fn().mockResolvedValue(true) }));

    await expect(service.request(context, 'TI-0001')).rejects.toBeInstanceOf(BadRequestException);
  });
});
