import { useState } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import api from '../lib/axios';
import {
  Banner,
  Button,
  Card,
  CardBody,
  ConfirmDialog,
  EmptyState,
  Spinner,
  Skeleton,
  Tabs,
} from '../components/ui';
import { useFlash } from '../lib/useFlash';
import { formatDateTime } from '../lib/format';
import { EmptyInbox } from '../components/illustrations';

function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return formatDateTime(d);
}

export default function Notifications() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const { message, error, flash, flashError } = useFlash(3000);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () =>
      api.get(`/notifications?page=${page}&limit=20`).then((res) => res.data),
    refetchInterval: 30000,
    placeholderData: keepPreviousData,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  const markReadMut = useMutation({
    mutationFn: (id) => api.patch(`/notifications/${id}/read`),
    onSuccess: invalidate,
    onError: (e) => flashError(e.response?.data?.error || 'Failed'),
  });
  const markAllReadMut = useMutation({
    mutationFn: () => api.post('/notifications/read-all', {}),
    onSuccess: () => {
      invalidate();
      flash('All marked as read');
    },
    onError: (e) => flashError(e.response?.data?.error || 'Failed'),
  });
  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/notifications/${id}`),
    onSuccess: () => {
      invalidate();
      flash('Notification removed');
    },
    onError: (e) => flashError(e.response?.data?.error || 'Failed'),
  });

  const items = data?.data || [];
  const unread = items.filter((n) => !n.read).length;
  const total = data?.total || 0;
  const limit = data?.limit || 20;
  const lastPage = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">
            Notifications
          </h1>
          <p className="text-sm text-fg-muted mt-1">
            {unread ? `${unread} unread on this page` : 'You are all caught up'}
          </p>
        </div>
        <Button variant="secondary" onClick={() => markAllReadMut.mutate()}>
          Mark all read
        </Button>
      </div>

      {message && <Banner kind="success">{message}</Banner>}
      {error && <Banner kind="error">{error}</Banner>}

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-md border border-border bg-surface-raised p-4 flex items-start gap-3"
            >
              <Skeleton className="w-9 h-9 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          illustration={<EmptyInbox />}
          title="No notifications"
          description="When something happens on your account — new attendance, ratings, meetings — it'll show up here."
        />
      ) : (
        <div
          className={[
            'space-y-2 transition-opacity',
            isFetching ? 'opacity-60' : '',
          ].join(' ')}
        >
          {items.map((n) => (
            <div
              key={n.id}
              className={[
                'rounded-md border bg-surface-raised p-4 flex items-start gap-3 transition-colors',
                n.read ? 'border-border' : 'border-brand-200 bg-brand-50/30',
              ].join(' ')}
            >
              <div
                className={[
                  'shrink-0 w-9 h-9 rounded-full flex items-center justify-center',
                  n.read
                    ? 'bg-surface-sunken text-fg-muted'
                    : 'bg-gradient-to-br from-brand-500 to-violet-600 text-white',
                ].join(' ')}
                aria-hidden="true"
              >
                🔔
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-fg">{n.message}</p>
                <p className="text-xs text-fg-muted mt-0.5">
                  {timeAgo(n.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!n.read && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => markReadMut.mutate(n.id)}
                  >
                    Mark read
                  </Button>
                )}
                <button
                  onClick={() => setConfirmDelete(n)}
                  className="p-1.5 rounded text-fg-muted hover:text-danger-600 hover:bg-danger-50 transition-colors"
                  title="Delete"
                  aria-label="Delete notification"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                  >
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > limit && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-fg-muted">
            Page {page} of {lastPage}
          </span>
          <Button
            variant="secondary"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= lastPage}
          >
            Next
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete notification?"
        message={confirmDelete?.message || ''}
        confirmLabel="Delete"
        danger
        onConfirm={() => deleteMut.mutate(confirmDelete.id)}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  );
}
