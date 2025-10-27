import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BugSpotter Demo',
  description: 'Interactive demo with intentional bugs',
};

export default function SubdomainLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
