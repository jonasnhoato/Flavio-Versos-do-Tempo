import { useEffect, useRef, type ReactNode } from 'react';
import { ClerkProvider, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { dark } from '@clerk/themes';
import { ptBR } from '@clerk/localizations';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
export const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const stripBase = (path: string) => basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;

function AuthCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const previous = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    return addListener(({ user }) => {
      const id = user?.id ?? null;
      if (previous.current !== undefined && previous.current !== id) queryClient.clear();
      previous.current = id;
    });
  }, [addListener, queryClient]);
  return null;
}

const appearance = {
  theme: dark,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#d1f36a',
    colorForeground: '#f0f0e8',
    colorMutedForeground: '#a6afa5',
    colorDanger: '#fb7185',
    colorBackground: '#111412',
    colorInput: '#090b0a',
    colorInputForeground: '#f0f0e8',
    colorNeutral: '#9da49c',
    fontFamily: 'Manrope, sans-serif',
    borderRadius: '.8rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#111412] rounded-2xl w-[440px] max-w-full overflow-hidden border border-[#303732]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#f0f0e8]',
    headerSubtitle: 'text-[#a6afa5]',
    socialButtonsBlockButtonText: 'text-[#f0f0e8]',
    formFieldLabel: 'text-[#f0f0e8]',
    footerActionLink: 'text-[#d1f36a]',
    footerActionText: 'text-[#a6afa5]',
    dividerText: 'text-[#a6afa5]',
    identityPreviewEditButton: 'text-[#d1f36a]',
    formFieldSuccessText: 'text-[#d1f36a]',
    alertText: 'text-[#f0f0e8]',
    formButtonPrimary: 'text-[#15190d]',
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  return <ClerkProvider
    publishableKey={clerkPubKey}
    proxyUrl={clerkProxyUrl}
    appearance={appearance}
    localization={{ ...ptBR, signIn: { ...ptBR.signIn, start: { ...ptBR.signIn?.start, subtitle: 'para continuar em Flavio Nhoato — Versos do Tempo' } } }}
    signInUrl={`${basePath}/sign-in`}
    signUpUrl={`${basePath}/sign-up`}
    signInFallbackRedirectUrl={`${basePath}/autor`}
    signUpFallbackRedirectUrl={`${basePath}/autor`}
    routerPush={to => setLocation(stripBase(to))}
    routerReplace={to => setLocation(stripBase(to), { replace: true })}
  >
    <AuthCacheInvalidator />
    {children}
  </ClerkProvider>;
}