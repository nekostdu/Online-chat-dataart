import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { Button, Card, ErrorText, Input, Label } from '@/components/ui';
import { errorMessage } from '@/api/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await authApi.requestReset(email);
      setSent(true);
    } catch (ex) {
      setErr(errorMessage(ex, 'Request failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-xl font-semibold mb-4 text-center">Forgot password</h1>
        {sent ? (
          <div className="text-center space-y-3">
            <p className="text-sm text-gray-700">
              If the email is registered, a reset link has been sent. In local dev, open{' '}
              <a href="http://localhost:8025" target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">MailHog</a>{' '}
              to see the message.
            </p>
            <Link to="/login" className="text-brand-600 hover:underline text-sm">Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <ErrorText>{err}</ErrorText>
            <Button type="submit" disabled={loading} className="w-full">Send reset link</Button>
            <div className="text-sm text-center">
              <Link to="/login" className="text-brand-600 hover:underline">Back to sign in</Link>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
