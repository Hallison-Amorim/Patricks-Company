import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EquipmentStatus, Prisma } from '@prisma/client';
import { LoansRepository } from './loans.repository';

export type LoanRequestContext = { tenantId: string; userId: string };
export type OpenLoan = {
  id: string;
  equipmentId: string;
  equipmentName: string;
  dueAt: string;
};

const MAX_OPEN_LOANS = 5;

export function addBusinessDays(start: Date, businessDays: number): Date {
  const result = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  let remaining = businessDays;

  while (remaining > 0) {
    result.setUTCDate(result.getUTCDate() + 1);
    const day = result.getUTCDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }

  return result;
}

@Injectable()
export class LoansService {
  constructor(private readonly repository: LoansRepository) {}

  async list(context: LoanRequestContext): Promise<OpenLoan[]> {
    return this.repository.transaction(async (db) => {
      const loans = await this.repository.listOpenLoans(db, context.tenantId, context.userId);
      return loans.map((loan) => ({
        id: loan.id,
        equipmentId: loan.equipment.assetTag,
        equipmentName: loan.equipment.name,
        dueAt: loan.dueAt.toISOString().slice(0, 10),
      }));
    });
  }

  async request(context: LoanRequestContext, assetTag: string, now = new Date()): Promise<OpenLoan> {
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    try {
      return await this.repository.transaction(async (db) => {
        const profile = await this.repository.findProfile(db, context.tenantId, context.userId);
        if (!profile) throw new ForbiddenException('Perfil não pertence ao tenant informado.');

        if (await this.repository.hasOverdueLoan(db, context.userId, today)) {
          throw new BadRequestException('Você possui empréstimo em atraso. Regularize-o antes de solicitar outro item.');
        }

        if (await this.repository.countOpenLoans(db, context.userId) >= MAX_OPEN_LOANS) {
          throw new BadRequestException(`Limite de ${MAX_OPEN_LOANS} empréstimos em aberto atingido.`);
        }

        const equipment = await this.repository.findEquipment(db, context.tenantId, assetTag);
        if (!equipment) throw new NotFoundException('Equipamento não encontrado.');
        if (equipment.status !== EquipmentStatus.available) {
          throw new BadRequestException('Equipamento indisponível para empréstimo.');
        }

        if (await this.repository.markLoaned(db, equipment.id) !== 1) {
          throw new ConflictException('O equipamento acabou de ser solicitado por outra pessoa.');
        }

        const loan = await this.repository.createLoan(db, {
          tenantId: context.tenantId,
          equipmentId: equipment.id,
          borrowerId: context.userId,
          dueAt: addBusinessDays(today, 14),
        });

        return {
          id: loan.id,
          equipmentId: loan.equipment.assetTag,
          equipmentName: loan.equipment.name,
          dueAt: loan.dueAt.toISOString().slice(0, 10),
        };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('O equipamento acabou de ser solicitado por outra pessoa.');
      }
      throw error;
    }
  }
}
