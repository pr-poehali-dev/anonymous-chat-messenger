import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const AUTH_URL = 'https://functions.poehali.dev/8bec5fb2-d0bf-4853-affb-a9ddaf8079b9';

interface AuthProps {
  onAuthSuccess: (userId: number, anonymousId: string, sessionToken: string) => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [anonymousId, setAnonymousId] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleRegister = async () => {
    if (password.length < 6) {
      toast({
        title: 'Ошибка',
        description: 'Пароль должен быть минимум 6 символов',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Ошибка',
        description: 'Пароли не совпадают',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Регистрация успешна!',
          description: `Ваш анонимный ID: ${data.anonymous_id}`,
        });
        onAuthSuccess(data.user_id, data.anonymous_id, data.session_token);
      } else {
        toast({
          title: 'Ошибка регистрации',
          description: data.error || 'Попробуйте снова',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка сети',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!anonymousId || !password) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', anonymous_id: anonymousId, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Авторизация успешна!',
          description: `Добро пожаловать, ${data.anonymous_id}`,
        });
        onAuthSuccess(data.user_id, data.anonymous_id, data.session_token);
      } else {
        toast({
          title: 'Ошибка авторизации',
          description: data.error || 'Неверный ID или пароль',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка сети',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Icon name="MessageCircle" size={32} className="text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Анонимный мессенджер</h1>
          <p className="text-muted-foreground">Защищенное общение с E2E шифрованием</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isLogin ? 'Вход' : 'Регистрация'}</CardTitle>
            <CardDescription>
              {isLogin
                ? 'Введите свой анонимный ID и пароль'
                : 'Создайте анонимный аккаунт за 30 секунд'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Анонимный ID</label>
                <Input
                  type="text"
                  placeholder="#1234"
                  value={anonymousId}
                  onChange={(e) => setAnonymousId(e.target.value)}
                  className="bg-muted"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Пароль</label>
              <Input
                type="password"
                placeholder="Минимум 6 символов"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-muted"
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Подтвердите пароль</label>
                <Input
                  type="password"
                  placeholder="Повторите пароль"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-muted"
                />
              </div>
            )}

            <Button
              className="w-full"
              onClick={isLogin ? handleLogin : handleRegister}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Загрузка...
                </>
              ) : isLogin ? (
                'Войти'
              ) : (
                'Зарегистрироваться'
              )}
            </Button>

            <div className="text-center pt-2">
              <Button
                variant="link"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setPassword('');
                  setConfirmPassword('');
                  setAnonymousId('');
                }}
              >
                {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
              </Button>
            </div>

            {!isLogin && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <Icon name="Shield" size={16} className="text-primary mt-1 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    После регистрации вы получите уникальный анонимный ID. Сохраните его вместе с
                    паролем — это единственный способ войти в аккаунт.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Icon name="Lock" size={16} className="text-primary mt-1 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Все сообщения защищены end-to-end шифрованием. Никто, кроме вас и получателя,
                    не сможет их прочитать.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
