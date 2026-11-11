import { PrismaClient, EquipmentStatus } from '@prisma/client';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const prisma = new PrismaClient();
const equipment = [
  ['TI-0001','Notebook 14 polegadas','notebook','available'],['TI-0002','Notebook 15 polegadas','notebook','available'],['TI-0003','Notebook 13 polegadas','notebook','available'],['TI-0004','Notebook 15 polegadas','notebook','maintenance'],['TI-0005','Monitor 24 polegadas','monitor','available'],['TI-0006','Monitor 27 polegadas','monitor','available'],['TI-0007','Monitor 22 polegadas','monitor','maintenance'],['TI-0008','Cabo HDMI 2 m','cabo','available'],['TI-0009','Cabo USB-C 1 m','cabo','available'],['TI-0010','Cabo de rede 3 m','cabo','maintenance'],['TI-0011','Webcam Full HD','camera','available'],['TI-0012','Câmera compacta','camera','available'],
] as const;

async function main() {
  const manifest = JSON.parse(await readFile(path.resolve(__dirname, '../../tmp/equipment-images/manifest.json'), 'utf8')) as Array<{ assetTag: string; photoId: number; pixabayUrl: string; author: string; authorUrl: string; license: string; licenseUrl: string; sha256: string }>;
  const tenant = await prisma.tenant.upsert({ where: { name: 'EMPREST.AI' }, update: {}, create: { name: 'EMPREST.AI' } });
  for (const [assetTag, name, category, status] of equipment) {
    const record = await prisma.equipment.upsert({
      where: { tenantId_assetTag: { tenantId: tenant.id, assetTag } },
      update: { name, category, status: status as EquipmentStatus },
      create: { tenantId: tenant.id, assetTag, name, category, status: status as EquipmentStatus },
    });
    const image = manifest.find((entry) => entry.assetTag === assetTag);
    if (image) await prisma.equipmentImage.upsert({ where: { equipmentId: record.id }, update: { pixabayImageId: BigInt(image.photoId), storagePath: `equipment-images/${assetTag.toLowerCase()}.jpg`, pixabayUrl: image.pixabayUrl, author: image.author, authorUrl: image.authorUrl, license: image.license, licenseUrl: image.licenseUrl, sha256: image.sha256, width: 800, height: 600 }, create: { equipmentId: record.id, pixabayImageId: BigInt(image.photoId), storagePath: `equipment-images/${assetTag.toLowerCase()}.jpg`, pixabayUrl: image.pixabayUrl, author: image.author, authorUrl: image.authorUrl, license: image.license, licenseUrl: image.licenseUrl, sha256: image.sha256, width: 800, height: 600 } });
  }
}
main().finally(() => prisma.$disconnect());
