import { SignIn, SignUp } from '@clerk/react';
import { basePath } from '@/components/auth-provider';
import { useMeta } from '@/hooks/use-meta';

export function AuthorSignIn() {
  useMeta('Acesso do autor — Flavio Nhoato', 'Entre na conta autorizada para publicar e organizar os poemas.');
  return <section className="ed-auth-page"><h1>Acesso do autor</h1><p>Apenas a conta autorizada pode publicar, editar e organizar os poemas.</p><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`}/></section>;
}

export function AuthorSignUp() {
  useMeta('Criar conta — Flavio Nhoato', 'Criar uma conta não concede permissão para alterar os poemas.');
  return <section className="ed-auth-page"><h1>Criar conta</h1><p>O cadastro, por si só, não concede acesso às ferramentas do autor.</p><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`}/></section>;
}