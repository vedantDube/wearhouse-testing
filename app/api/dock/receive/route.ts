import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { trackingAwb, tapeIntact, boxCrushed, isTampered, otpProvided, evidenceUrl } = body;

    if (!trackingAwb) {
      return NextResponse.json({ error: 'Tracking AWB is required' }, { status: 400 });
    }

    console.log(`[Dock Receive] Intake recorded for AWB: ${trackingAwb}`, body);

    // TODO: You can insert your Prisma logic here to update the manifest status to 'AT_DOCK'
    // await prisma.manifest.update({ where: { trackingAwb }, data: { status: 'AT_DOCK' }});

    return NextResponse.json({ 
      success: true, 
      message: 'Package intake recorded successfully',
      data: body
    }, { status: 200 });

  } catch (error: any) {
    console.error('🔥 DOCK RECEIVE CRASHED:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}