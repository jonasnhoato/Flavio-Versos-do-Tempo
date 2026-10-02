import { SignIn } from '@clerk/react';
import { basePath } from '@/components/auth-provider';
import { useMeta } from '@/hooks/use-meta';

export function AuthorSignIn() {
  useMeta('Acesso do autor — Flavio Nhoato', 'Entre na conta autorizada para publicar e organizar os poemas.');
  return <section className="ed-auth-page"><h1>Acesso do autor</h1><p>Apenas a conta autorizada pode publicar, editar e organizar os poemas.</p><SignIn routing="path" path={`${basePath}/sign-in`} withSignUp={false} appearance={{ elements: { footerAction: { display: 'none' } } }}/></section>;
}