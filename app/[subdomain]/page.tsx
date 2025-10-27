import { headers } from 'next/headers';
import KazBankDemo from './kazbank/page';
import TalentFlowDemo from './talentflow/page';
import QuickMartDemo from './quickmart/page';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function SubdomainRoot() {
  const headersList = await headers();
  const demoType = headersList.get('X-Demo-Type');
  const sessionId = headersList.get('X-Session-ID');

  // If no demo type but has session ID, redirect to dashboard
  if (!demoType && sessionId) {
    redirect('/dashboard');
  }

  // If no valid demo type or session, redirect to main site
  if (!demoType || !sessionId) {
    redirect('/');
  }

  // Render the appropriate demo component
  switch (demoType) {
    case 'kazbank':
      return <KazBankDemo />;
    case 'talentflow':
      return <TalentFlowDemo />;
    case 'quickmart':
      return <QuickMartDemo />;
    default:
      redirect('/');
  }
}
