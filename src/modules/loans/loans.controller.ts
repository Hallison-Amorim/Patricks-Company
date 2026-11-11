import { Controller, Get, Param, Post } from '@nestjs/common';
import { LoansService } from './loans.service';
@Controller('loans')
export class LoansController {
  constructor(private readonly loans: LoansService) {}
  @Get() list() { return this.loans.list(); }
  @Post(':equipmentId') request(@Param('equipmentId') equipmentId: string) { return this.loans.request(equipmentId); }
}
