import { loadWizardWishes } from '@/server/wizard-wishes';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const result = await loadWizardWishes();
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Ucapan belum dapat dimuat. Silakan coba kembali.' }, {
      status: 502, headers: { 'Cache-Control': 'no-store' },
    });
  }
}
