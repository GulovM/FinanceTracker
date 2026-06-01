import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, register, setToken } from "@/lib/api";

export default function Register() {
  const [firstName, setFirstName] = useState("");
  const [secondName, setSecondName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    setIsLoading(true);
    try {
      await register({ firstName, secondName, email, password });
      const res = await login(email, password);
      setToken(res.token);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      navigate("/", { replace: true });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка регистрации");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Регистрация</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">Имя</Label>
                <Input
                  id="firstName"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondName">Фамилия</Label>
                <Input
                  id="secondName"
                  autoComplete="family-name"
                  value={secondName}
                  onChange={(e) => setSecondName(e.target.value)}
                  required
                />
              </div>
            </div>

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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Повторите пароль</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}

            <Button
              className="w-full"
              size="lg"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Создание..." : "Создать аккаунт"}
            </Button>

            <p className="text-center text-sm text-[var(--text-muted)]">
              Уже есть аккаунт?{" "}
              <Link className="text-[var(--accent-primary)] hover:underline" to="/login">
                Войти
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
