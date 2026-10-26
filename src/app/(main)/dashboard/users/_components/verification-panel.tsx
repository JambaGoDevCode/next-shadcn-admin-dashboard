import Link from "next/link";

import { ArrowRight, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, profileTypeLabel } from "@/lib/format";

export interface VerificationRow {
  id: number;
  name: string;
  email: string;
  type?: string;
  status?: string;
  createdAt?: string;
  emailVerifiedAt?: string | null;
  termsAcceptedAt?: string | null;
}

interface VerificationPanelProps {
  rows: VerificationRow[];
  failed: boolean;
}

interface StatProps {
  label: string;
  value: string;
  hint?: string;
  failed?: boolean;
}

function Stat({ label, value, hint, failed = false }: StatProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="font-normal text-muted-foreground text-sm">{label}</CardTitle>
        {failed && <span className="text-destructive text-xs">offline</span>}
      </CardHeader>
      <CardContent>
        <div className="text-3xl leading-none tracking-tight tabular-nums">{failed ? "—" : value}</div>
        {hint && !failed && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export function VerificationPanel({ rows, failed }: VerificationPanelProps) {
  const verified = rows.filter((row) => row.emailVerifiedAt).length;
  const pending = rows.filter((row) => !row.emailVerifiedAt);
  const withTerms = rows.filter((row) => row.termsAcceptedAt).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Contas verificadas" value={String(verified)} hint="E-mail confirmado" failed={failed} />
        <Stat label="Por verificar" value={String(pending.length)} hint="Aguardam verificação de e-mail" failed={failed} />
        <Stat label="Termos aceites" value={String(withTerms)} hint={`De ${rows.length} contas`} failed={failed} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contas por verificar</CardTitle>
          <CardDescription>
            E-mail ainda não verificado. «Consultar perfil» abre a conta em Todos os utilizadores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {failed ? (
            <p className="text-muted-foreground py-6 text-center text-sm">— API indisponível</p>
          ) : pending.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-6 text-center">
              <ShieldCheck className="size-6 text-muted-foreground/50" />
              <p className="text-muted-foreground text-sm">Todas as contas estão verificadas.</p>
            </div>
          ) : (
            <ul className="divide-y text-sm">
              {pending.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{row.name}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {row.email}
                      {row.type ? ` · ${profileTypeLabel(row.type)}` : ""} · Registo {formatDate(row.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="secondary">Por verificar</Badge>
                    <Link
                      href={`/dashboard/users?userId=${row.id}`}
                      aria-label={`Consultar perfil de ${row.name}`}
                      className="text-muted-foreground rounded-md p-1.5 transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-xs">
        Nota: a plataforma exige apenas verificação de e-mail por OTP — não há documentos de identificação em falta e a
        API não expõe endpoint de documentos de verificação.
      </p>
    </div>
  );
}
