import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type EquipmentStatus = 'available' | 'maintenance' | 'loaned';
export type Equipment = { id: string; name: string; category: string; status: EquipmentStatus; imageUrl: string | null };

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly equipment: Equipment[] = [
    ['TI-0001','Notebook 14 polegadas','Notebook','available'],['TI-0002','Notebook 15 polegadas','Notebook','available'],['TI-0003','Notebook 13 polegadas','Notebook','available'],['TI-0004','Notebook 15 polegadas','Notebook','maintenance'],['TI-0005','Monitor 24 polegadas','Monitor','available'],['TI-0006','Monitor 27 polegadas','Monitor','available'],['TI-0007','Monitor 22 polegadas','Monitor','maintenance'],['TI-0008','Cabo HDMI 2 m','Cabo','available'],['TI-0009','Cabo USB-C 1 m','Cabo','available'],['TI-0010','Cabo de rede 3 m','Cabo','maintenance'],['TI-0011','Webcam Full HD','Câmera','available'],['TI-0012','Câmera compacta','Câmera','available'],
  ].map(([id, name, category, status]) => ({ id, name, category, status: status as EquipmentStatus, imageUrl: null }));

  async list(): Promise<Equipment[]> {
    const rows = await this.prisma.equipment.findMany({ orderBy: { assetTag: 'asc' }, include: { image: true } });
    return rows.map((row) => ({ id: row.assetTag, name: row.name, category: row.category, status: row.status, imageUrl: row.image?.storagePath ?? null }));
  }
  find(id: string): Equipment | undefined { return this.equipment.find((item) => item.id === id); }
  markLoaned(id: string): void { const item = this.find(id); if (item) item.status = 'loaned'; }
}
