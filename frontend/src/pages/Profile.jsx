import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import {
  Avatar,
  Badge,
  Banner,
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Skeleton,
} from '../components/ui';
import useAuthStore from '../store/auth';
import { useFlash } from '../lib/useFlash';

const ROLE_COLOR = {
  ADMIN: 'danger',
  SENIOR_TL: 'info',
  TL: 'brand',
  CAPTAIN: 'success',
  INTERN: 'neutral',
};

export default function Profile() {
  const queryClient = useQueryClient();
  const { user, patchUser } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const { message, error, flash, flashError } = useFlash(3000);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['myProfile'],
    queryFn: () => api.get('/users/me').then((res) => res.data),
  });

  useEffect(() => {
    if (profile) setFullName(profile.full_name || '');
  }, [profile]);

  const updateProfileMut = useMutation({
    mutationFn: (data) => api.patch('/users/me', data),
    onSuccess: (_res, vars) => {
      flash('Profile updated');
      if (vars?.full_name) patchUser({ fullName: vars.full_name });
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
    onError: (err) => flashError(err.response?.data?.error || 'Update failed'),
  });
  const changePasswordMut = useMutation({
    mutationFn: (data) => api.patch('/users/me/password', data),
    onSuccess: () => {
      flash('Password changed');
      setOldPassword('');
      setNewPassword('');
    },
    onError: (err) =>
      flashError(err.response?.data?.error || 'Password change failed'),
  });
  const avatarMut = useMutation({
    mutationFn: (file) => {
      const form = new FormData();
      form.append('file', file);
      return api.post('/uploads/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      flash('Avatar updated');
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
    onError: (err) => flashError(err.response?.data?.error || 'Upload failed'),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40 w-full rounded-md" />
          <Skeleton className="h-40 w-full rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">
          My Profile
        </h1>
        <p className="text-sm text-fg-muted mt-1">
          Manage your account details and password.
        </p>
      </div>

      {message && <Banner kind="success">{message}</Banner>}
      {error && <Banner kind="error">{error}</Banner>}

      {/* Hero card with avatar */}
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-br from-fg to-fg/70" />
        <div className="px-6 pb-6 -mt-10 flex items-end gap-4 flex-wrap">
          <div className="relative">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-20 h-20 rounded-md object-cover border-4 border-surface-raised shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 rounded-md bg-gradient-to-br from-brand-500 to-violet-600 text-white flex items-center justify-center text-2xl font-bold border-4 border-surface-raised shadow-sm">
                {(profile?.full_name || profile?.email || '?')
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((w) => w[0]?.toUpperCase() || '')
                  .join('')}
              </div>
            )}
            <label
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-surface-raised shadow border border-border flex items-center justify-center cursor-pointer hover:scale-105 transition"
              title="Change avatar"
            >
              <svg
                className="w-3.5 h-3.5 text-fg-muted"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                aria-label="Change avatar"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (f) avatarMut.mutate(f);
                }}
              />
            </label>
          </div>
          <div className="pb-1">
            <h2 className="text-lg font-semibold text-fg">
              {profile?.full_name || 'Unnamed'}
            </h2>
            <p className="text-sm text-fg-muted">{profile?.email}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Badge
                size="sm"
                tone={ROLE_COLOR[profile?.role] || 'neutral'}
                dot
              >
                {profile?.role}
              </Badge>
              <Badge
                size="sm"
                tone={profile?.suspended ? 'danger' : 'success'}
                dot
              >
                {profile?.suspended ? 'Suspended' : 'Active'}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Display name" />
          <CardBody className="space-y-3">
            <Input
              label="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Button
              onClick={() => updateProfileMut.mutate({ full_name: fullName })}
              loading={updateProfileMut.isPending}
            >
              Save name
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Password"
            subtitle="Use 8+ characters with a mix of letters and numbers."
          />
          <CardBody className="space-y-3">
            <Input
              label="Current password"
              type="password"
              autoComplete="current-password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Button
              variant="primary"
              onClick={() =>
                changePasswordMut.mutate({ oldPassword, newPassword })
              }
              loading={changePasswordMut.isPending}
              disabled={!oldPassword || newPassword.length < 8}
            >
              Update password
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
