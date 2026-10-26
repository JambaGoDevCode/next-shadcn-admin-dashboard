"use client";

import { useTransition, useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  email: z.email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  remember: z.boolean().optional(),
});

const otpSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, { message: "Enter the 6-digit code." }),
});

interface LoginResponse {
  ok?: boolean;
  message?: string;
  otpRequired?: boolean;
  challengeId?: number;
  destination?: string;
  expiresAt?: string;
  developmentCode?: string;
}

interface OtpChallenge {
  challengeId: number;
  destination?: string;
  expiresAt?: string;
  developmentCode?: string;
}

export function LoginForm({ returnTo }: { returnTo?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: "" },
  });

  function navigateAfterLogin() {
    const destination = returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/dashboard/peladeiro";
    router.push(destination);
    router.refresh();
  }

  function onSubmit(data: z.infer<typeof formSchema>) {
    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email, password: data.password }),
        });

        const payload: LoginResponse | null = await response.json().catch(() => null);

        if (!response.ok) {
          toast.error(payload?.message ?? "Invalid email or password.");
          return;
        }

        if (payload?.otpRequired && typeof payload.challengeId === "number") {
          setChallenge({
            challengeId: payload.challengeId,
            destination: payload.destination,
            expiresAt: payload.expiresAt,
            developmentCode: payload.developmentCode,
          });
          return;
        }

        toast.success("Signed in successfully.");
        navigateAfterLogin();
      } catch {
        toast.error("Could not reach the server. Try again.");
      }
    });
  }

  function onVerifyOtp(data: z.infer<typeof otpSchema>) {
    if (!challenge) return;

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/login/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ challengeId: challenge.challengeId, code: data.code }),
        });

        const payload: LoginResponse | null = await response.json().catch(() => null);

        if (!response.ok) {
          toast.error(payload?.message ?? "Invalid verification code.");
          otpForm.resetField("code");
          return;
        }

        toast.success("Signed in successfully.");
        navigateAfterLogin();
      } catch {
        toast.error("Could not reach the server. Try again.");
      }
    });
  }

  if (challenge) {
    return (
      <form noValidate onSubmit={otpForm.handleSubmit(onVerifyOtp)} className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted">
            <MailCheck className="size-6 text-muted-foreground" />
          </span>
          <div className="space-y-1">
            <p className="font-medium">Check your inbox</p>
            <p className="text-muted-foreground text-sm">
              We sent a 6-digit code to {challenge.destination ?? "your email"}. It expires in 10 minutes.
            </p>
          </div>
        </div>
        {challenge.developmentCode && (
          <p className="rounded-md bg-muted px-3 py-2 text-center font-mono text-muted-foreground text-sm">
            Dev code: {challenge.developmentCode}
          </p>
        )}
        <FieldGroup className="gap-4">
          <Controller
            control={otpForm.control}
            name="code"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="login-otp">Verification code</FieldLabel>
                <Input
                  {...field}
                  id="login-otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="••••••"
                  maxLength={6}
                  className="text-center font-mono text-lg tracking-[0.5em]"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>
        <Button className="w-full" type="submit" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" data-icon="inline-start" />}
          {isPending ? "Verifying..." : "Verify code"}
        </Button>
        <Button
          className="w-full"
          type="button"
          variant="ghost"
          disabled={isPending}
          onClick={() => {
            setChallenge(null);
            otpForm.reset();
          }}
        >
          <ArrowLeft data-icon="inline-start" />
          Use a different account
        </Button>
      </form>
    );
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FieldGroup className="gap-4">
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="login-email">Email Address</FieldLabel>
              <Input
                {...field}
                id="login-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="login-password">Password</FieldLabel>
              <Input
                {...field}
                id="login-password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="remember"
          render={({ field, fieldState }) => (
            <Field orientation="horizontal" data-invalid={fieldState.invalid}>
              <Checkbox
                id="login-remember"
                name={field.name}
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                aria-invalid={fieldState.invalid}
              />
              <FieldContent>
                <FieldLabel htmlFor="login-remember" className="font-normal">
                  Remember me for 30 days
                </FieldLabel>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </FieldContent>
            </Field>
          )}
        />
      </FieldGroup>
      <Button className="w-full" type="submit" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" data-icon="inline-start" />}
        {isPending ? "Signing in..." : "Login"}
      </Button>
    </form>
  );
}
