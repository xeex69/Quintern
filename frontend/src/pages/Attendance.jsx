import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import useAuthStore from '../store/auth';
import AttendanceMarkForm from '../components/AttendanceMarkForm';
import BulkAttendanceForm from '../components/BulkAttendanceForm';
import {
  Badge,
  Banner,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Select,
  Spinner,
  Skeleton,
} from '../components/ui';
import { Heatmap } from '../components/charts';
import {
  ATTENDANCE_BADGE,
  ATTENDANCE_LABEL,
  isManager,
} from '../lib/constants';
import { formatDate } from '../lib/format';
import { EmptyCalendar } from '../components/illustrations';

export default function Attendance() {
  const { user } = useAuthStore();
  const canMark = isManager(user?.role);
  const [viewUserId, setViewUserId] = useState(user?.id || '');

  const { data: team = [] } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: () => api.get('/team/members').then((res) => res.data),
    enabled: canMark,
  });

  const {
    data: records,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['attendance', viewUserId],
    queryFn: () => api.get(`/attendance/${viewUserId}`).then((res) => res.data),
    enabled: !!viewUserId,
  });

  // Build 8-week x 7-day heatmap of recent attendance
  const today = new Date();
  const days = 7;
  const weeks = 8;
  const heatmap = (() => {
    const cells = [];
    for (let w = weeks - 1; w >= 0; w--) {
      for (let d = 0; d < days; d++) {
        const dt = new Date(today);
        dt.setDate(today.getDate() - (w * days + (days - 1 - d)));
        const dateStr = dt.toISOString().slice(0, 10);
        const r = (records || []).find((x) => x.date === dateStr);
        // Map every status to a heatmap value. Neutral states (LEAVE, EXAM_LEAVE)
        // are rendered as "neutral" — present in the calendar but not scored.
        const value = !r
          ? null
          : r.status === 'PRESENT' || r.status === 'WFH'
            ? 100
            : r.status === 'HALF_DAY'
              ? 50
              : r.status === 'LEAVE' || r.status === 'EXAM_LEAVE'
                ? 30
                : r.status === 'ABSENT'
                  ? 0
                  : null;
        cells.push({
          row: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][d],
          col: `W${weeks - w}`,
          date: dateStr,
          value,
          status: r?.status,
        });
      }
    }
    return cells;
  })();
  const cols = Array.from({ length: weeks }, (_, i) => `W${i + 1}`);

  const selectedName =
    viewUserId === user?.id
      ? 'me'
      : team.find((m) => m.id === viewUserId)?.full_name ||
        team.find((m) => m.id === viewUserId)?.email ||
        'this user';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">
          Attendance
        </h1>
        <p className="text-sm text-fg-muted mt-1">
          Track daily attendance for yourself and your team.
        </p>
      </div>

      {canMark && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <AttendanceMarkForm />
          <BulkAttendanceForm />
        </div>
      )}

      <Card>
        <CardBody>
          <label
            htmlFor="view-attendance-of"
            className="block text-xs font-medium text-fg-muted mb-1.5"
          >
            View attendance of
          </label>
          {canMark ? (
            <Select
              id="view-attendance-of"
              value={viewUserId}
              onChange={(e) => setViewUserId(e.target.value)}
              className="max-w-md"
            >
              <option value={user?.id}>Me ({user?.email})</option>
              {team.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name || m.email} ({m.role})
                </option>
              ))}
            </Select>
          ) : (
            <p className="text-sm text-fg">My attendance</p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2 className="text-sm font-semibold text-fg mb-3">
            8 weeks · {records?.length || 0} records
          </h2>
          {!records?.length ? (
            <p className="text-sm text-fg-muted text-center py-6">
              No records to plot yet.
            </p>
          ) : (
            <Heatmap
              cells={heatmap}
              rows={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
              cols={cols}
              valueKey="value"
            />
          )}
          <div className="flex items-center gap-3 text-xs text-fg-muted mt-3 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Present
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" /> Work From
              Home
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Half day
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Leave
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" /> Exam
              Leave
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Absent
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm border border-border" />{' '}
              No record
            </span>
          </div>
        </CardBody>
      </Card>

      <Card className="overflow-hidden">
        <CardBody className="!p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : error ? (
            <Banner kind="error" className="m-5">
              {error.response?.data?.error || 'Failed to load attendance'}
            </Banner>
          ) : !records?.length ? (
            <EmptyState
              illustration={<EmptyCalendar />}
              title="No records"
              description={
                selectedName === 'me'
                  ? 'No attendance has been marked for you yet.'
                  : 'No attendance for this team member yet.'
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-sunken text-fg-muted">
                  <tr>
                    {['Date', 'Status', 'Remarks'].map((h) => (
                      <th
                        key={h}
                        className="text-left font-medium text-xs uppercase tracking-wider px-4 py-2.5"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {records.map((a) => (
                    <tr
                      key={a.id}
                      className="hover:bg-surface-sunken/50 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-fg tabular-nums">
                        {formatDate(a.date)}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge
                          size="sm"
                          tone={
                            a.status === 'PRESENT' || a.status === 'WFH'
                              ? 'success'
                              : a.status === 'ABSENT'
                                ? 'danger'
                                : a.status === 'HALF_DAY'
                                  ? 'warning'
                                  : a.status === 'LEAVE'
                                    ? 'info'
                                    : 'brand'
                          }
                          dot
                        >
                          {ATTENDANCE_LABEL[a.status] || a.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-fg-muted">
                        {a.remarks || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
