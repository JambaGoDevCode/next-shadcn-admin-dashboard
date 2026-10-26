import { Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SYSTEM_ROLES } from "@/lib/api/admin";

import { PermissionCheck } from "./_components/permission-check";

export default function RolesPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-3xl tracking-tight">Papéis e permissões</h1>
        <p className="text-muted-foreground text-sm">Papéis do sistema do peladeiro-api e verificação de permissões.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="size-4" /> Papéis do sistema
          </CardTitle>
          <CardDescription>
            Criados pela migração de seed da API com IDs fixos (1–10). Não há endpoint de listagem — a atribuição é
            feita por <code>roleId</code> na tela de usuários.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-28">Sistema</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SYSTEM_ROLES.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="tabular-nums">{role.id}</TableCell>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell className="text-muted-foreground">{role.description}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">fixo</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verificar permissão</CardTitle>
          <CardDescription>
            Consulta se um usuário possui uma permissão específica (tabela de permissões da API).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PermissionCheck />
        </CardContent>
      </Card>
    </div>
  );
}
