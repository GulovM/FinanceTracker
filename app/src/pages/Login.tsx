import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { login, restoreUser, setToken } from "@/lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoreMode, setIsRestoreMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);
    try {
      if (isRestoreMode) {
        await restoreUser(email, password);
        setIsRestoreMode(false);
        setMessage("Профиль восстановлен. Теперь можно войти.");
        return;
      }
      const res = await login(email, password);
      setToken(res.token);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      navigate("/", { replace: true });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка входа");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Вход</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
            {message ? (
              <p className="text-sm text-[var(--accent-secondary)]">{message}</p>
            ) : null}
            <Button
              className="w-full"
              size="lg"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "..." : isRestoreMode ? "Восстановить" : "Войти"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMessage(null);
                setIsRestoreMode((value) => !value);
              }}
              className="w-full text-center text-sm text-[var(--accent-primary)] hover:underline"
            >
              {isRestoreMode ? "Вернуться ко входу" : "Восстановить удалённый профиль"}
            </button>
            <p className="text-center text-sm text-[var(--text-muted)]">
              Нет аккаунта?{" "}
              <Link className="text-[var(--accent-primary)] hover:underline" to="/register">
                Зарегистрироваться
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
