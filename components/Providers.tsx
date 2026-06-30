'use client';

import { ReactNode } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';

  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#3b82f6',
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'all-users',
          },
        },

      }}
    >
      {children}
    </PrivyProvider>
  );
}
