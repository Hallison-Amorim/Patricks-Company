import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CatalogService } from '../catalog/catalog.service';

type Loan = { equipmentId: string; equipmentName: string; dueAt: string };
@Injectable()
export class LoansService {
  private readonly loans: Loan[] = [];
  constructor(private readonly catalog: CatalogService) {}
  list(): Loan[] { return this.loans; }
  request(equipmentId: string): Loan {
    if (this.loans.length >= 3) throw new BadRequestException('Limite de 3 empréstimos em aberto atingido.');
    const item = this.catalog.find(equipmentId);
    if (!item) throw new NotFoundException('Equipamento não encontrado.');
    if (item.status !== 'available') throw new BadRequestException('Equipamento indisponível para empréstimo.');
    const due = new Date(); due.setDate(due.getDate() + 14);
    const loan = { equipmentId: item.id, equipmentName: item.name, dueAt: due.toISOString().slice(0, 10) };
    this.loans.push(loan); this.catalog.markLoaned(item.id); return loan;
  }
}
