import { useState, FormEvent } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { Button, Card, ErrorText, Input, Label } from '@/components/ui';
import { errorMessage } from '@/api/client';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const token = params.get('token') ?? '';
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    if (pw !== pw2) { setErr('Passwords do not match'); return; }
    setLoading(true);
    try {
      await authApi.confirmReset(token, pw);
      setDone(true);
      setTimeout(() => nav('/login'), 1500);
    } catch (ex) {
      setErr(errorMessage(ex, 'Reset failed'));
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="p-6 text-center">
        <p>Missing reset token.</p>
        <Link to="/forgot-password" className="text-brand-600 hover:underline">Request again</Link>
      </div>
    );
  }

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-xl font-semibold mb-4 text-center">Set a new password</h1>
        {done ? (
          <p className="text-sm text-center">Password updated. Redirecting to sign in…</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>New password</Label>
              <Input type="password" value={pw} onChange={e => setPw(e.target.value)} required minLength={8} />
            </div>
            <div>
              <Label>Confirm password</Label>
              <Input type="password" value={pw2} onChange={e => setPw2(e.target.value)} required minLength={8} />
            </div>
            <ErrorText>{err}</ErrorText>
            <Button type="submit" disabled={loading} className="w-full">Save new password</Button>
          </form>
        )}
      </Card>
    </div>
  );
}
