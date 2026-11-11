import { PrismaClient, EquipmentStatus } from '@prisma/client';

const prisma = new PrismaClient();
const equipment = [
  ['TI-0001','Notebook 14 polegadas','notebook','available'],['TI-0002','Notebook 15 polegadas','notebook','available'],['TI-0003','Notebook 13 polegadas','notebook','available'],['TI-0004','Notebook 15 polegadas','notebook','maintenance'],['TI-0005','Monitor 24 polegadas','monitor','available'],['TI-0006','Monitor 27 polegadas','monitor','available'],['TI-0007','Monitor 22 polegadas','monitor','maintenance'],['TI-0008','Cabo HDMI 2 m','cabo','available'],['TI-0009','Cabo USB-C 1 m','cabo','available'],['TI-0010','Cabo de rede 3 m','cabo','maintenance'],['TI-0011','Webcam Full HD','camera','available'],['TI-0012','Câmera compacta','camera','available'],
] as const;

async function main() {
  const tenant = await prisma.tenant.upsert({ where: { name: 'EMPREST.AI' }, update: {}, create: { name: 'EMPREST.AI' } });
  for (const [assetTag, name, category, status] of equipment) {
    await prisma.equipment.upsert({
      where: { tenantId_assetTag: { tenantId: tenant.id, assetTag } },
      update: { name, category, status: status as EquipmentStatus },
      create: { tenantId: tenant.id, assetTag, name, category, status: status as EquipmentStatus },
    });
  }
}
main().finally(() => prisma.$disconnect());
