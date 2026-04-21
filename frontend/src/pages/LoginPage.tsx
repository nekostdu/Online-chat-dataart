import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/store/authStore';
import { Button, Card, ErrorText, Input, Label } from '@/components/ui';
import { errorMessage } from '@/api/client';

export default function LoginPage() {
  const nav = useNavigate();
  const { login, loading } = useAuth();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await login(id, pw);
      nav('/chat');
    } catch (ex) {
      setErr(errorMessage(ex, 'Sign-in failed'));
    }
  }

  return (
    <div className="min-h-full flex flex-col">
      <header className="px-6 py-4 bg-white border-b border-gray-100 flex justify-between items-center">
        <div className="font-bold text-brand-600 text-lg">ChatLogo</div>
        <div className="text-sm">
          <Link to="/login" className="mr-4 text-brand-600 font-medium">Sign in</Link>
          <Link to="/register" className="text-gray-600 hover:text-gray-900">Register</Link>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-6">
          <h1 className="text-xl font-semibold mb-5 text-center">Sign in</h1>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>Email or username</Label>
              <Input
                autoFocus
                value={id}
                onChange={e => setId(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={pw}
                onChange={e => setPw(e.target.value)}
                required
              />
            </div>
            <ErrorText>{err}</ErrorText>
            <Button type="submit" disabled={loading} className="w-full">Sign in</Button>
            <div className="text-sm text-center text-gray-500">
              <Link to="/forgot-password" className="text-brand-600 hover:underline">Forgot password?</Link>
            </div>
            <div className="text-sm text-center text-gray-600 pt-2 border-t border-gray-100">
              No account? <Link to="/register" className="text-brand-600 hover:underline">Create one</Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
