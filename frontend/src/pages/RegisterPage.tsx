import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/store/authStore';
import { Button, Card, ErrorText, Input, Label } from '@/components/ui';
import { errorMessage } from '@/api/client';

export default function RegisterPage() {
  const nav = useNavigate();
  const { register, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    if (pw !== pw2) { setErr('Passwords do not match'); return; }
    try {
      await register(email, username, pw);
      nav('/chat');
    } catch (ex) {
      setErr(errorMessage(ex, 'Registration failed'));
    }
  }

  return (
    <div className="min-h-full flex flex-col">
      <header className="px-6 py-4 bg-white border-b border-gray-100 flex justify-between items-center">
        <div className="font-bold text-brand-600 text-lg">ChatLogo</div>
        <div className="text-sm">
          <Link to="/login" className="mr-4 text-gray-600 hover:text-gray-900">Sign in</Link>
          <Link to="/register" className="text-brand-600 font-medium">Register</Link>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-6">
          <h1 className="text-xl font-semibold mb-5 text-center">Create account</h1>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label>Username</Label>
              <Input value={username} onChange={e => setUsername(e.target.value)} required
                     minLength={3} maxLength={32} pattern="[a-zA-Z0-9_.\-]{3,32}" />
              <div className="text-xs text-gray-500 mt-1">3–32 chars, letters, digits, . _ -</div>
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={pw} onChange={e => setPw(e.target.value)} required minLength={8} />
            </div>
            <div>
              <Label>Confirm password</Label>
              <Input type="password" value={pw2} onChange={e => setPw2(e.target.value)} required minLength={8} />
            </div>
            <ErrorText>{err}</ErrorText>
            <Button type="submit" disabled={loading} className="w-full">Create account</Button>
            <div className="text-sm text-center text-gray-600 pt-2 border-t border-gray-100">
              Have account? <Link to="/login" className="text-brand-600 hover:underline">Sign in</Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
