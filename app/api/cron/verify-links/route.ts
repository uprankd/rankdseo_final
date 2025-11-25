import { NextResponse } from 'next/server';
import { verifyAllLinks } from '@/lib/jobs/link-verification';

// This endpoint can be called by a cron job every 10 minutes
export async function GET(request: Request) {
  try {
    // Optional: Add authentication for production
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    console.log('⏰ Cron job triggered: Link verification');
    
    const result = await verifyAllLinks();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
