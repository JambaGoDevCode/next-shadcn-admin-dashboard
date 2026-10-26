"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Profile } from "@/lib/api/types";
import { createProfileAction, updateProfileAction } from "@/server/actions/users";

interface UserProfileCardProps {
  userId: number;
  profile: Profile | null;
  onChanged?: (profile: Profile) => void;
}

export function UserProfileCard({ userId, profile, onChanged }: UserProfileCardProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(profile?.firstName ?? "");
  const [lastName, setLastName] = useState(profile?.lastName ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    startTransition(async () => {
      const result = await createProfileAction(userId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Perfil criado.");
      onChanged?.(result.data);
      router.refresh();
    });
  }

  function handleSave() {
    if (!profile) return;
    startTransition(async () => {
      const result = await updateProfileAction(userId, {
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        phone: phone.trim() || null,
        bio: bio.trim() || null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      toast.success("Perfil atualizado.");
      onChanged?.(result.data);
      router.refresh();
    });
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-muted-foreground text-sm">Este usuário ainda não possui um perfil na plataforma.</p>
        <Button size="sm" variant="outline" disabled={isPending} onClick={handleCreate}>
          {isPending ? <Loader2 className="animate-spin" /> : <UserPlus />}
          Criar perfil
        </Button>
        {error && <p className="text-destructive text-sm">{error}</p>}
      </div>
    );
  }

  return (
    <FieldGroup className="gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="profile-first-name">Primeiro nome</FieldLabel>
          <Input id="profile-first-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="profile-last-name">Sobrenome</FieldLabel>
          <Input id="profile-last-name" value={lastName} onChange={(event) => setLastName(event.target.value)} />
        </Field>
      </div>
      <Field>
        <FieldLabel htmlFor="profile-phone">Telefone</FieldLabel>
        <Input
          id="profile-phone"
          value={phone}
          placeholder="(11) 99999-9999"
          onChange={(event) => setPhone(event.target.value)}
        />
      </Field>
      <Field data-invalid={Boolean(error)}>
        <FieldLabel htmlFor="profile-bio">Bio</FieldLabel>
        <Textarea
          id="profile-bio"
          value={bio}
          rows={3}
          onChange={(event) => setBio(event.target.value)}
          aria-invalid={Boolean(error)}
        />
        {error && <FieldError errors={[{ message: error }]} />}
      </Field>
      <div className="flex justify-end">
        <Button size="sm" disabled={isPending} onClick={handleSave}>
          {isPending && <Loader2 className="animate-spin" data-icon="inline-start" />}
          {isPending ? "Salvando..." : "Salvar perfil"}
        </Button>
      </div>
    </FieldGroup>
  );
}
