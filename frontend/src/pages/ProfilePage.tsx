import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { authApi } from '@/api/auth';
import { useAuth } from '@/store/authStore';
import { Button, Card, ErrorText, Input, Label } from '@/components/ui';
import { errorMessage } from '@/api/client';
import type { Session } from '@/api/types';

dayjs.extend(relativeTime);

export default function ProfilePage() {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwStatus, setPwStatus] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [revoking, setRevoking] = useState<number | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      setSessions(await authApi.sessions());
    } catch (e) {
      console.error(e);
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setPwErr(null); setPwStatus(null);
    try {
      await authApi.changePassword(curPw, newPw);
      setPwStatus('Password updated.');
      setCurPw(''); setNewPw('');
    } catch (ex) {
      setPwErr(errorMessage(ex, 'Password change failed'));
    }
  }

  async function revoke(s: Session) {
    const msg = s.current
      ? 'Revoke THIS session? You will be signed out of this browser.'
      : 'Revoke this session? That device will be signed out.';
    if (!confirm(msg)) return;
    setRevoking(s.id);
    try {
      await authApi.revokeSession(s.id);
      if (s.current) {
        await logout();
        nav('/login');
        return;
      }
      await loadSessions();
    } catch (ex) {
      alert(errorMessage(ex));
    } finally {
      setRevoking(null);
    }
  }

  async function deleteAccount() {
    if (!confirm('Delete your account? This cannot be undone. Your owned rooms will be removed.')) return;
    setDeleting(true);
    try {
      await authApi.deleteAccount();
      nav('/login');
    } catch (ex) {
      alert(errorMessage(ex));
    } finally {
      setDeleting(false);
    }
  }

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <Card className="p-5">
        <h2 className="text-lg font-semibold mb-4">Profile</h2>
        <div className="text-sm space-y-1">
          <div><span className="text-gray-500">Username:</span> {user.username}</div>
          <div><span className="text-gray-500">Email:</span> {user.email}</div>
          {user.lastLoginAt && (
            <div><span className="text-gray-500">Last login:</span> {dayjs(user.lastLoginAt).fromNow()}</div>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-lg font-semibold mb-4">Change password</h2>
        <form onSubmit={changePassword} className="space-y-3 max-w-sm">
          <div>
            <Label>Current password</Label>
            <Input type="password" value={curPw} onChange={e => setCurPw(e.target.value)} required />
          </div>
          <div>
            <Label>New password</Label>
            <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={8} />
          </div>
          <ErrorText>{pwErr}</ErrorText>
          {pwStatus && <div className="text-sm text-green-600">{pwStatus}</div>}
          <Button type="submit">Update password</Button>
        </form>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Active sessions</h2>
          <Button variant="ghost" onClick={loadSessions}>Refresh</Button>
        </div>
        <ul className="space-y-3">
          {sessions.length === 0 && (
            <li className="text-sm text-gray-500">No active sessions.</li>
          )}
          {sessions.map(s => (
            <li
              key={s.id}
              className={`rounded-lg border p-4 ${s.current ? 'border-brand-300 bg-brand-50/40' : 'border-gray-100 bg-white'}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{shortAgent(s.userAgent)}</span>
                    {s.current && (
                      <span className="inline-flex items-center rounded-full bg-brand-500 text-white text-xs px-2 py-0.5">
                        this device
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 font-mono break-all" title={s.userAgent ?? ''}>
                    {s.userAgent ?? '—'}
                  </div>
                  <div className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                    <span><span className="text-gray-400">IP:</span> {s.ip ?? '—'}</span>
                    <span><span className="text-gray-400">Signed in:</span> {dayjs(s.createdAt).fromNow()}</span>
                    <span><span className="text-gray-400">Last active:</span> {dayjs(s.lastSeenAt).fromNow()}</span>
                  </div>
                </div>
                <Button
                  variant={s.current ? 'secondary' : 'danger'}
                  disabled={revoking === s.id}
                  onClick={() => revoke(s)}
                >
                  {revoking === s.id ? 'Revoking…' : s.current ? 'Sign out here' : 'Revoke'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-5 border-red-100">
        <h2 className="text-lg font-semibold mb-2 text-red-600">Danger zone</h2>
        <p className="text-sm text-gray-600 mb-3">
          Deleting your account removes your owned rooms (and their messages/files) permanently.
        </p>
        <Button variant="danger" onClick={deleteAccount} disabled={deleting}>Delete account</Button>
      </Card>
    </div>
  );
}

function shortAgent(ua: string | null): string {
  if (!ua) return 'Unknown device';
  const browser =
    /Firefox\/[\d.]+/.exec(ua)?.[0] ||
    /Edg\/[\d.]+/.exec(ua)?.[0] ||
    /OPR\/[\d.]+/.exec(ua)?.[0] ||
    /Chrome\/[\d.]+/.exec(ua)?.[0] ||
    /Safari\/[\d.]+/.exec(ua)?.[0] ||
    'Browser';
  const os =
    /Mac OS X [\d_]+/.test(ua) ? 'macOS'
    : /Windows NT [\d.]+/.test(ua) ? 'Windows'
    : /Linux/.test(ua) ? 'Linux'
    : /Android/.test(ua) ? 'Android'
    : /iPhone|iPad/.test(ua) ? 'iOS'
    : 'Unknown OS';
  return `${browser.split('/')[0]} on ${os}`;
}
