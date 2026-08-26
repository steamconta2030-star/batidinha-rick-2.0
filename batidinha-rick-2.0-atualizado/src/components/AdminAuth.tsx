import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { Flame, LoaderCircle, LockKeyhole, LogOut } from "lucide-react";
import { supabase } from "../lib/supabase";

const STORE_ID = "10000000-0000-4000-8000-000000000001";

type MembershipRole = "owner" | "manager" | "operator";

type Membership = {
  role: MembershipRole;
};

export default function AdminAuth({ children, onBack }: { children: ReactNode; onBack: () => void }) {
  const [session, setSession] = useState<Session | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [localAccess, setLocalAccess] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verifyAccess(nextSession: Session | null) {
      if (!supabase) {
        if (!cancelled) {
          setSession(null);
          setMembership(null);
          setChecking(false);
        }
        return;
      }

      if (!nextSession) {
        if (!cancelled) {
          setSession(null);
          setMembership(null);
          setChecking(false);
        }
        return;
      }

      setChecking(true);
      const { data, error: membershipError } = await supabase
        .from("store_members")
        .select("role")
        .eq("store_id", STORE_ID)
        .eq("user_id", nextSession.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (membershipError) {
        setError("Não foi possível validar sua permissão de acesso.");
        setSession(null);
        setMembership(null);
        setChecking(false);
        return;
      }

      if (!data) {
        await supabase.auth.signOut();
        setError("Esta conta não possui acesso administrativo a esta loja.");
        setSession(null);
        setMembership(null);
        setChecking(false);
        return;
      }

      setSession(nextSession);
      setMembership({ role: data.role as MembershipRole });
      setError("");
      setChecking(false);
    }

    if (!supabase) {
      setChecking(false);
      return () => { cancelled = true; };
    }

    supabase.auth.getSession().then(({ data }) => verifyAccess(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void verifyAccess(nextSession);
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError("");
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    if (authError) setError("E-mail ou senha inválidos.");
    setSubmitting(false);
  }

  async function signOut() {
    setMembership(null);
    setSession(null);
    setLocalAccess(false);
    if (supabase) await supabase.auth.signOut();
  }

  if (checking) return <div className="admin-auth"><LoaderCircle className="auth-spinner" /><span>Verificando acesso...</span></div>;

  if (!session && !localAccess) return <div className="admin-auth"><form className="admin-login" onSubmit={login}>
    <div className="admin-login-brand"><span><Flame size={25} /></span><div><strong>Batidinha do Rick</strong><small>Acesso administrativo</small></div></div>
    <div className="admin-login-icon"><LockKeyhole /></div><h1>Entrar no painel</h1><p>Use uma conta autorizada para administrar esta loja.</p>
    {supabase ? <><label>E-mail<input name="email" type="email" autoComplete="email" required placeholder="seu@email.com" /></label>
    <label>Senha<input name="password" type="password" autoComplete="current-password" required placeholder="Sua senha" /></label></> : <p>O Supabase ainda não foi configurado. Você pode testar o painel localmente; os dados ficarão neste navegador.</p>}
    {error && <span className="admin-login-error" role="alert">{error}</span>}
    {supabase ? <button className="primary" type="submit" disabled={submitting}>{submitting ? "Entrando..." : "Entrar"}</button> : <button className="primary" type="button" onClick={() => setLocalAccess(true)}>Entrar no modo demonstração</button>}
    <button className="admin-back" type="button" onClick={onBack}>Voltar ao cardápio</button>
  </form></div>;

  return <>{children}<button className="admin-signout" onClick={signOut} title={membership ? `Sair do painel • ${membership.role}` : "Sair do painel"}><LogOut size={17} /> Sair</button></>;
}
