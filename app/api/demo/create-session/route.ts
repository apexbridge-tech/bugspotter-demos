import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/session-manager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { company } = body;

    if (!company || typeof company !== 'string') {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    // Validate company name length
    if (company.length < 2 || company.length > 50) {
      return NextResponse.json(
        { error: 'Company name must be between 2 and 50 characters' },
        { status: 400 }
      );
    }

    // Create new demo session
    const session = await createSession(company);

    return NextResponse.json({
      success: true,
      session: {
        subdomain: session.subdomain,
        company: session.company,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    console.error('Error creating demo session:', error);
    return NextResponse.json({ error: 'Failed to create demo session' }, { status: 500 });
  }
}
