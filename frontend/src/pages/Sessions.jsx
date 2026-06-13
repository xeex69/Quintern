import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import useAuthStore from '../store/auth';
import {
  Banner,
  Button,
  Card,
  CardBody,
  ConfirmDialog,
  EmptyState,
  Spinner,
  Skeleton,
} from '../components/ui';
import { useFlash } from '../lib/useFlash';
import { formatDateTime, formatDate } from '../lib/format';
import { EmptySearch } from '../components/illustrations';

export default function Sessions() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const { message, error, flash, flashError } = useFlash(3000);
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.get('/sessions/me').then((res) => res.data),
  });

  const [confirmRevoke, setConfirmRevoke] = useState(null);
  const [confirmAll, setConfirmAll] = useState(false);

  const revokeMut = useMutation({
    mutationFn: (sessionId) => api.delete(`/sessions/me/${sessionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      flash('Session revoked');
    },
    onError: (e) => flashError(e.response?.data?.error || 'Failed to revoke'),
  });
  const revokeAllMut = useMutation({
    mutationFn: () => api.post('/sessions/me/revoke-all', {}),
    onSuccess: () => {
      queryClient.clear();
      window.location.href = '/login';
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">
            Active Sessions
          </h1>
          <p className="text-sm text-fg-muted mt-1">
            Devices currently signed in to your account.
          </p>
        </div>
        <Button variant="danger" onClick={() => setConfirmAll(true)}>
          Revoke all others
        </Button>
      </div>

      {message && <Banner kind="success">{message}</Banner>}
      {error && <Banner kind="error">{error}</Banner>}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <CardBody className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-2 w-1/2" />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : !sessions?.length ? (
        <EmptyState
          illustration={<EmptySearch />}
          title="No active sessions"
          description="Sessions appear when you sign in. You can revoke individual devices here."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sessions.map((s) => {
            const isCurrent =
              s.tokenHash &&
              accessToken &&
              s.tokenHash.endsWith(accessToken.slice(-8));
            return (
              <Card key={s.sessionId} className="lift">
                <CardBody className="flex items-center gap-3">
                  <div className="shrink-0 w-10 h-10 rounded-md bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center text-lg">
                    💻
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-fg">Session</p>
                      {isCurrent && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                          THIS DEVICE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-fg-muted mt-0.5">
                      Started {formatDateTime(s.createdAt)}
                    </p>
                    <p className="text-xs text-fg-muted">
                      Expires {formatDate(s.expiresAt)}
                    </p>
                  </div>
                  {!isCurrent && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setConfirmRevoke(s)}
                    >
                      Revoke
                    </Button>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmRevoke}
        title="Revoke this session?"
        message="This device will be signed out immediately."
        confirmLabel="Revoke"
        danger
        onConfirm={() => revokeMut.mutate(confirmRevoke.sessionId)}
        onClose={() => setConfirmRevoke(null)}
      />
      <ConfirmDialog
        open={confirmAll}
        title="Revoke all other sessions?"
        message="All other devices will be signed out. You will stay signed in on this one."
        confirmLabel="Revoke all"
        danger
        onConfirm={() => {
          revokeAllMut.mutate();
          setConfirmAll(false);
        }}
        onClose={() => setConfirmAll(false)}
      />
    </div>
  );
}
