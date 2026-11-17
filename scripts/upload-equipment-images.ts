import { createClient } from '@supabase/supabase-js';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const bucket = 'equipment-images';
const imagesDirectory = path.resolve(__dirname, '../../front/public/equipment');

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} precisa estar configurada para enviar imagens.`);
  return value;
}

async function main(): Promise<void> {
  const client = createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const files = (await readdir(imagesDirectory)).filter((file) => /^ti-\d{4}\.jpg$/i.test(file));
  if (files.length !== 12) throw new Error(`Esperadas 12 imagens, encontradas ${files.length}.`);

  for (const file of files) {
    const { error } = await client.storage.from(bucket).upload(file, await readFile(path.join(imagesDirectory, file)), {
      upsert: true,
      contentType: 'image/jpeg',
      cacheControl: '31536000',
    });
    if (error) throw error;
  }

  console.log(`${files.length} imagens enviadas ao bucket ${bucket}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
