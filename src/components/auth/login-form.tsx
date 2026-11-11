"use client";
import { useActionState, useState } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { login } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function LoginForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(login, { error: null });
  const [visible, setVisible] = useState(false);
  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          E-mail corporativo
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="seu.nome@youcon.com.br"
          required
          maxLength={254}
          disabled={!configured || pending}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Senha
        </label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={visible ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Digite sua senha"
            className="pr-12"
            required
            maxLength={256}
            disabled={!configured || pending}
          />
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={visible}
            className="absolute right-3 top-3 rounded text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            disabled={!configured}
          >
            {visible ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>
      {state.error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}
      <Button
        type="submit"
        disabled={!configured || pending}
        className="w-full"
      >
        {pending ? (
          <>
            <LoaderCircle className="animate-spin" />
            Entrando…
          </>
        ) : (
          <>
            Entrar na plataforma
            <ArrowRight />
          </>
        )}
      </Button>
      <p className="text-center text-xs leading-5 text-muted-foreground">
        Primeiro acesso ou dificuldade para entrar?
        <br />
        Solicite suporte ao time de Gente & Gestão.
      </p>
    </form>
  );
}
