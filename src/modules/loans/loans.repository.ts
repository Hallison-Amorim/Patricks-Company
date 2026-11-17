import { EquipmentStatus, Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type DbClient = Prisma.TransactionClient;

@Injectable()
export class LoansRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(operation: (db: DbClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(operation, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  findProfile(db: DbClient, tenantId: string, profileId: string) {
    return db.profile.findFirst({ where: { id: profileId, tenantId } });
  }

  countOpenLoans(db: DbClient, borrowerId: string): Promise<number> {
    return db.loan.count({ where: { borrowerId, returnedAt: null } });
  }

  hasOverdueLoan(db: DbClient, borrowerId: string, today: Date): Promise<boolean> {
    return db.loan.count({
      where: { borrowerId, returnedAt: null, dueAt: { lt: today } },
    }).then((count) => count > 0);
  }

  findEquipment(db: DbClient, tenantId: string, assetTag: string) {
    return db.equipment.findUnique({
      where: { tenantId_assetTag: { tenantId, assetTag } },
    });
  }

  markLoaned(db: DbClient, equipmentId: string): Promise<number> {
    return db.equipment.updateMany({
      where: { id: equipmentId, status: EquipmentStatus.available },
      data: { status: EquipmentStatus.loaned },
    }).then((result) => result.count);
  }

  createLoan(
    db: DbClient,
    input: { tenantId: string; equipmentId: string; borrowerId: string; dueAt: Date },
  ) {
    return db.loan.create({
      data: input,
      include: { equipment: { select: { assetTag: true, name: true } } },
    });
  }

  listOpenLoans(db: DbClient, tenantId: string, borrowerId: string) {
    return db.loan.findMany({
      where: { tenantId, borrowerId, returnedAt: null },
      orderBy: { dueAt: 'asc' },
      include: { equipment: { select: { assetTag: true, name: true } } },
    });
  }
}
