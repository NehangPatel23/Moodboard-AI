import { InviteAcceptClient } from '@/components/invite/InviteAcceptClient';
import { LandingHeader } from '@/components/landing/LandingHeader';

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-20 pt-6 md:px-8 md:pt-10">
      <LandingHeader />
      <InviteAcceptClient token={token} />
    </main>
  );
}
