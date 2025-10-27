import type { Metadata } from 'next';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const demoType = headersList.get('x-demo-type') || '';

  const demoConfig: Record<string, { title: string; description: string; icon: string }> = {
    kazbank: {
      title: 'KazBank - Banking Demo',
      description: 'Experience modern banking with intentional bugs for testing',
      icon: '🏦',
    },
    talentflow: {
      title: 'TalentFlow - HR Platform Demo',
      description: 'Recruitment and applicant tracking with bug scenarios',
      icon: '👔',
    },
    quickmart: {
      title: 'QuickMart - E-commerce Demo',
      description: 'Online shopping experience with realistic bugs',
      icon: '🛒',
    },
  };

  const config = demoConfig[demoType] || {
    title: 'BugSpotter Demo',
    description: 'Interactive demo with intentional bugs',
    icon: '🐛',
  };

  return {
    title: config.title,
    description: config.description,
    icons: {
      icon: [
        {
          url: `data:image/svg+xml,<svg xmlns="http://w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${config.icon}</text></svg>`,
          type: 'image/svg+xml',
        },
      ],
    },
  };
}

export default function SubdomainLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
