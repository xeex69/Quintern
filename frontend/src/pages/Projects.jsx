import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/axios';
import {
  Avatar,
  Badge,
  Banner,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Input,
  Modal,
  Progress,
  Select,
  Spinner,
  StatCard,
  Textarea,
  ConfirmDialog,
  toast,
} from '../components/ui';
import { useFlash } from '../lib/useFlash';
import { formatDate } from '../lib/format';

const STATUS_TONE = {
  PLANNING: 'neutral',
  ACTIVE: 'success',
  ON_HOLD: 'warning',
  COMPLETED: 'info',
  CANCELLED: 'danger',
};
const HEALTH_TONE = {
  ON_TRACK: 'success',
  AT_RISK: 'warning',
  OFF_TRACK: 'danger',
};
const PRIORITY_TONE = {
  LOW: 'neutral',
  MEDIUM: 'brand',
  HIGH: 'warning',
  CRITICAL: 'danger',
};
const TASK_STATUSES = [
  'TODO',
  'IN_PROGRESS',
  'BLOCKED',
  'IN_REVIEW',
  'DONE',
  'CANCELLED',
];

function NewProjectModal({ onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    description: '',
    status: 'PLANNING',
    priority: 'MEDIUM',
    health: 'ON_TRACK',
    start_date: '',
    due_date: '',
  });
  const { message, error, flash, flashError } = useFlash(2500);
  const createMut = useMutation({
    mutationFn: (data) => api.post('/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProjects'] });
      flash('Project created');
      onClose();
    },
    onError: (e) => flashError(e.response?.data?.error || 'Failed to create'),
  });
  return (
    <Modal
      open
      onClose={onClose}
      title="New project"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => createMut.mutate(form)}
            loading={createMut.isPending}
            disabled={!form.name}
          >
            Create project
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {message && <Banner kind="success">{message}</Banner>}
        {error && <Banner kind="error">{error}</Banner>}
        <Input
          label="Name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Spring Internship Cohort 2026"
        />
        <Textarea
          label="Description"
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            {['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'].map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              )
            )}
          </Select>
          <Select
            label="Priority"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
          >
            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
          <Select
            label="Health"
            value={form.health}
            onChange={(e) => setForm({ ...form, health: e.target.value })}
          >
            {['ON_TRACK', 'AT_RISK', 'OFF_TRACK'].map((h) => (
              <option key={h} value={h}>
                {h.replace('_', ' ')}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Start date"
            type="date"
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
          />
          <Input
            label="Due date"
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          />
        </div>
      </div>
    </Modal>
  );
}

function NewTaskModal({ projectId, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    due_date: '',
    estimated_hours: '',
  });
  const { message, error, flash, flashError } = useFlash(2500);
  const mut = useMutation({
    mutationFn: (data) => api.post(`/projects/${projectId}/tasks`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      flash('Task added');
      onClose();
    },
    onError: (e) => flashError(e.response?.data?.error || 'Failed'),
  });
  return (
    <Modal
      open
      onClose={onClose}
      title="New task"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => mut.mutate(form)}
            loading={mut.isPending}
            disabled={!form.title}
          >
            Add task
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {message && <Banner kind="success">{message}</Banner>}
        {error && <Banner kind="error">{error}</Banner>}
        <Input
          label="Title"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="What needs to get done?"
        />
        <Textarea
          label="Description"
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Priority"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
          >
            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
          <Input
            label="Due date"
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          />
        </div>
      </div>
    </Modal>
  );
}

function ProjectCard({ p, onOpen }) {
  return (
    <Card className="lift cursor-pointer" onClick={() => onOpen(p.id)}>
      <CardBody>
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-sm font-semibold text-fg line-clamp-2 min-h-[2.5rem]">
            {p.name}
          </h3>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge size="sm" tone={STATUS_TONE[p.status]} dot>
              {p.status}
            </Badge>
            <Badge size="sm" tone={HEALTH_TONE[p.health]} dot>
              {p.health?.replace('_', ' ')}
            </Badge>
          </div>
        </div>
        {p.description && (
          <p className="text-xs text-fg-muted line-clamp-2 mb-3">
            {p.description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-fg-muted mb-1.5">
          <span>Progress</span>
          <span className="font-medium text-fg tabular-nums">
            {p.progress}%
          </span>
        </div>
        <Progress
          value={p.progress}
          tone={
            p.progress >= 70
              ? 'success'
              : p.progress >= 40
                ? 'warning'
                : 'brand'
          }
        />
        <div className="flex items-center justify-between text-xs text-fg-muted mt-3">
          <span>👥 {p.member_count || 0}</span>
          <span>
            📋 {p.task_count || 0} ({p.done_count || 0} done)
          </span>
          {p.due_date && <span>⏰ {formatDate(p.due_date)}</span>}
        </div>
      </CardBody>
    </Card>
  );
}

function KanbanBoard({
  tasks,
  onStatusChange,
  onTaskClick,
  onDeleteTask,
  canEdit,
}) {
  const grouped = useMemo(() => {
    const out = Object.fromEntries(TASK_STATUSES.map((s) => [s, []]));
    for (const t of tasks) {
      if (out[t.status]) out[t.status].push(t);
      else out[t.status] = [t];
    }
    return out;
  }, [tasks]);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="inline-grid grid-cols-6 gap-3 min-w-full">
        {TASK_STATUSES.map((s) => (
          <div
            key={s}
            className="bg-surface-sunken/50 rounded-md p-2 min-h-[200px]"
          >
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-xs font-semibold text-fg uppercase tracking-wider">
                {s.replace('_', ' ')}
              </p>
              <span className="text-[10px] text-fg-muted tabular-nums">
                {grouped[s].length}
              </span>
            </div>
            <div className="space-y-2">
              {grouped[s].length === 0 ? (
                <p className="text-[10px] text-fg-subtle italic px-1 py-2">
                  No tasks
                </p>
              ) : (
                grouped[s].map((t) => (
                  <div
                    key={t.id}
                    className="bg-surface-raised border border-border rounded-md p-2.5 cursor-pointer hover:border-border-strong transition-all"
                    onClick={() => onTaskClick?.(t)}
                  >
                    <div className="flex items-start justify-between gap-1.5 mb-1.5">
                      <p className="text-xs font-medium text-fg line-clamp-2">
                        {t.title}
                      </p>
                      {canEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTask?.(t);
                          }}
                          className="text-fg-muted hover:text-danger-600 transition-colors shrink-0"
                          title="Delete task"
                          aria-label="Delete task"
                        >
                          <svg
                            className="w-3 h-3"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                          >
                            <path d="M3 4h10v9a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM5 2h6v1H5V2z" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                      <Badge size="sm" tone={PRIORITY_TONE[t.priority]}>
                        {t.priority}
                      </Badge>
                      {t.due_date && (
                        <span className="text-fg-muted">
                          ⏰ {formatDate(t.due_date)}
                        </span>
                      )}
                    </div>
                    {t.assignee_name && (
                      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border">
                        <Avatar user={t} size="xs" />
                        <span className="text-[10px] text-fg-muted truncate">
                          {t.assignee_name}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectDetail({ projectId, onClose }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('board'); // 'board' | 'list' | 'overview' | 'milestones' | 'risks' | 'members'
  const [showNewTask, setShowNewTask] = useState(false);
  const [confirmDeleteTask, setConfirmDeleteTask] = useState(null);
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(false);
  const { message, error, flash, flashError } = useFlash(2500);

  const { data: p, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/projects/${projectId}`).then((r) => r.data),
  });

  const inv = () =>
    queryClient.invalidateQueries({ queryKey: ['project', projectId] });
  const deleteTaskMut = useMutation({
    mutationFn: (id) => api.delete(`/projects/tasks/${id}`),
    onSuccess: () => {
      inv();
      queryClient.invalidateQueries({ queryKey: ['myProjects'] });
      flash('Task deleted');
      setConfirmDeleteTask(null);
    },
    onError: (e) => flashError(e.response?.data?.error || 'Failed'),
  });
  const deleteProjectMut = useMutation({
    mutationFn: () => api.delete(`/projects/${projectId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProjects'] });
      toast({ kind: 'success', title: 'Project deleted' });
      onClose?.();
    },
    onError: (e) => flashError(e.response?.data?.error || 'Failed'),
  });
  const statusMut = useMutation({
    mutationFn: (status) => api.patch(`/projects/${projectId}`, { status }),
    onSuccess: () => {
      inv();
      queryClient.invalidateQueries({ queryKey: ['myProjects'] });
      flash('Status updated');
    },
    onError: (e) => flashError(e.response?.data?.error || 'Failed'),
  });
  const healthMut = useMutation({
    mutationFn: (health) => api.patch(`/projects/${projectId}`, { health }),
    onSuccess: () => {
      inv();
      flash('Health updated');
    },
    onError: (e) => flashError(e.response?.data?.error || 'Failed'),
  });
  const taskStatusMut = useMutation({
    mutationFn: ({ taskId, status }) =>
      api.patch(`/projects/tasks/${taskId}`, { status }),
    onSuccess: () => {
      inv();
      queryClient.invalidateQueries({ queryKey: ['myProjectTasks'] });
      queryClient.invalidateQueries({ queryKey: ['myProjects'] });
    },
  });

  if (isLoading || !p) {
    return (
      <div className="p-10">
        <Spinner label="Loading project..." />
      </div>
    );
  }

  const tasks = p.tasks || [];
  const milestones = p.milestones || [];
  const risks = p.risks || [];
  const members = p.members || [];

  return (
    <div className="space-y-4">
      {message && <Banner kind="success">{message}</Banner>}
      {error && <Banner kind="error">{error}</Banner>}

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-semibold text-fg truncate">{p.name}</h2>
            <Badge size="sm" tone={STATUS_TONE[p.status]} dot>
              {p.status}
            </Badge>
            <Badge size="sm" tone={HEALTH_TONE[p.health]} dot>
              {p.health?.replace('_', ' ')}
            </Badge>
            <Badge size="sm" tone={PRIORITY_TONE[p.priority]}>
              {p.priority}
            </Badge>
          </div>
          {p.description && (
            <p className="text-sm text-fg-muted mt-1">{p.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={p.status}
            onChange={(e) => statusMut.mutate(e.target.value)}
            className="w-auto min-w-[140px]"
          >
            {['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'].map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              )
            )}
          </Select>
          <Select
            value={p.health}
            onChange={(e) => healthMut.mutate(e.target.value)}
            className="w-auto min-w-[140px]"
          >
            {['ON_TRACK', 'AT_RISK', 'OFF_TRACK'].map((h) => (
              <option key={h} value={h}>
                {h.replace('_', ' ')}
              </option>
            ))}
          </Select>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowNewTask(true)}
          >
            + Task
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-fg-muted hover:text-danger-600"
            onClick={() => setConfirmDeleteProject(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="rounded-md border border-border p-3">
          <p className="text-[10px] uppercase tracking-wider text-fg-muted">
            Progress
          </p>
          <p className="text-xl font-semibold text-fg tabular-nums mt-1">
            {p.progress}%
          </p>
          <Progress
            value={p.progress}
            tone={
              p.progress >= 70
                ? 'success'
                : p.progress >= 40
                  ? 'warning'
                  : 'brand'
            }
            className="mt-1.5"
          />
        </div>
        <div className="rounded-md border border-border p-3">
          <p className="text-[10px] uppercase tracking-wider text-fg-muted">
            Tasks
          </p>
          <p className="text-xl font-semibold text-fg tabular-nums mt-1">
            {tasks.filter((t) => t.status === 'DONE').length} / {tasks.length}
          </p>
        </div>
        <div className="rounded-md border border-border p-3">
          <p className="text-[10px] uppercase tracking-wider text-fg-muted">
            Members
          </p>
          <p className="text-xl font-semibold text-fg tabular-nums mt-1">
            {members.length}
          </p>
        </div>
        <div className="rounded-md border border-border p-3">
          <p className="text-[10px] uppercase tracking-wider text-fg-muted">
            Due
          </p>
          <p className="text-sm font-medium text-fg mt-1">
            {p.due_date ? formatDate(p.due_date) : '—'}
          </p>
        </div>
      </div>

      <div
        className="flex items-center gap-1 border-b border-border"
        role="tablist"
      >
        {['board', 'list', 'overview', 'milestones', 'risks', 'members'].map(
          (t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              data-active={tab === t}
              onClick={() => setTab(t)}
              className={[
                'tab-indicator relative px-3 py-2 text-sm font-medium transition-colors',
                tab === t ? 'text-fg' : 'text-fg-muted hover:text-fg',
              ].join(' ')}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          )
        )}
      </div>

      {tab === 'board' && (
        <KanbanBoard
          tasks={tasks}
          onStatusChange={(taskId, status) =>
            taskStatusMut.mutate({ taskId, status })
          }
          onDeleteTask={setConfirmDeleteTask}
        />
      )}

      {tab === 'list' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-sunken text-fg-muted">
                <tr>
                  {['Task', 'Status', 'Priority', 'Assignee', 'Due'].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left font-medium text-xs uppercase tracking-wider px-4 py-2.5"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tasks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-fg-muted"
                    >
                      No tasks yet
                    </td>
                  </tr>
                ) : (
                  tasks.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-surface-sunken/50 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-sm font-medium text-fg">
                        {t.title}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge
                          size="sm"
                          tone={
                            t.status === 'DONE'
                              ? 'success'
                              : t.status === 'IN_PROGRESS'
                                ? 'info'
                                : t.status === 'BLOCKED'
                                  ? 'danger'
                                  : 'neutral'
                          }
                        >
                          {t.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge size="sm" tone={PRIORITY_TONE[t.priority]}>
                          {t.priority}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-fg-muted">
                        {t.assignee_name || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-fg-muted">
                        {t.due_date ? formatDate(t.due_date) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'overview' && (
        <Card>
          <CardBody>
            <h3 className="text-sm font-semibold text-fg mb-3">
              Project overview
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-fg-muted uppercase tracking-wider">
                  Owner
                </dt>
                <dd className="text-fg">{p.owner_name || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-fg-muted uppercase tracking-wider">
                  Department
                </dt>
                <dd className="text-fg">{p.department_name || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-fg-muted uppercase tracking-wider">
                  Start date
                </dt>
                <dd className="text-fg">
                  {p.start_date ? formatDate(p.start_date) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-fg-muted uppercase tracking-wider">
                  Due date
                </dt>
                <dd className="text-fg">
                  {p.due_date ? formatDate(p.due_date) : '—'}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-fg-muted uppercase tracking-wider">
                  Description
                </dt>
                <dd className="text-fg mt-1">{p.description || '—'}</dd>
              </div>
            </dl>
          </CardBody>
        </Card>
      )}

      {tab === 'milestones' && (
        <Card>
          <CardBody>
            {milestones.length === 0 ? (
              <EmptyState icon="🏁" title="No milestones yet" />
            ) : (
              <ul className="space-y-2">
                {milestones.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-md border border-border"
                  >
                    <div>
                      <p className="text-sm font-medium text-fg">{m.name}</p>
                      <p className="text-xs text-fg-muted">
                        {m.completed_at
                          ? `Completed ${formatDate(m.completed_at)}`
                          : `Due ${formatDate(m.due_date)}`}
                      </p>
                    </div>
                    <Badge
                      size="sm"
                      tone={m.completed_at ? 'success' : 'warning'}
                      dot
                    >
                      {m.completed_at ? 'DONE' : 'PENDING'}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      )}

      {tab === 'risks' && (
        <Card>
          <CardBody>
            {risks.length === 0 ? (
              <EmptyState
                icon="🛡️"
                title="No risks logged"
                description="Risks help flag scope, dependency, or staffing issues."
              />
            ) : (
              <ul className="space-y-2">
                {risks.map((r) => (
                  <li
                    key={r.id}
                    className="p-3 rounded-md border border-border"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-fg">{r.title}</p>
                      <Badge
                        size="sm"
                        tone={
                          r.severity === 'CRITICAL'
                            ? 'danger'
                            : r.severity === 'HIGH'
                              ? 'warning'
                              : 'neutral'
                        }
                        dot
                      >
                        {r.severity}
                      </Badge>
                    </div>
                    {r.description && (
                      <p className="text-xs text-fg-muted">{r.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      )}

      {tab === 'members' && (
        <Card>
          <CardBody>
            {members.length === 0 ? (
              <EmptyState icon="👥" title="No members" />
            ) : (
              <ul className="space-y-2">
                {members.map((m) => (
                  <li
                    key={m.user_id}
                    className="flex items-center gap-3 p-2 rounded-md border border-border"
                  >
                    <Avatar user={m} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-fg truncate">
                        {m.full_name || m.email}
                      </p>
                      <p className="text-xs text-fg-muted">{m.role}</p>
                    </div>
                    <Badge size="sm" tone="brand">
                      {m.role}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      )}

      {showNewTask && (
        <NewTaskModal
          projectId={projectId}
          onClose={() => setShowNewTask(false)}
        />
      )}

      <ConfirmDialog
        open={!!confirmDeleteTask}
        title="Delete task?"
        message={
          confirmDeleteTask
            ? `Permanently delete "${confirmDeleteTask.title}"?`
            : ''
        }
        confirmLabel="Delete"
        danger
        onConfirm={() => deleteTaskMut.mutate(confirmDeleteTask.id)}
        onClose={() => setConfirmDeleteTask(null)}
      />
      <ConfirmDialog
        open={confirmDeleteProject}
        title="Delete project?"
        message={`Permanently delete "${p.name}" and all its tasks?`}
        confirmLabel="Delete project"
        danger
        onConfirm={() => {
          deleteProjectMut.mutate();
          setConfirmDeleteProject(false);
        }}
        onClose={() => setConfirmDeleteProject(false)}
      />
    </div>
  );
}

export default function Projects() {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['myProjects'],
    queryFn: () => api.get('/projects/me').then((r) => r.data),
  });
  const [view, setView] = useState('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [openProject, setOpenProject] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (statusFilter && p.status !== statusFilter) return false;
      if (!q) return true;
      return (p.name || '').toLowerCase().includes(q);
    });
  }, [projects, search, statusFilter]);

  const stats = useMemo(() => {
    const active = projects.filter((p) => p.status === 'ACTIVE').length;
    const onTrack = projects.filter((p) => p.health === 'ON_TRACK').length;
    const atRisk = projects.filter(
      (p) => p.health === 'AT_RISK' || p.health === 'OFF_TRACK'
    ).length;
    const totalTasks = projects.reduce((s, p) => s + (p.task_count || 0), 0);
    return { active, onTrack, atRisk, totalTasks };
  }, [projects]);

  if (openProject) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setOpenProject(null)}>
          ← Back to projects
        </Button>
        <ProjectDetail
          projectId={openProject}
          onClose={() => setOpenProject(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">
            Projects
          </h1>
          <p className="text-sm text-fg-muted mt-1">
            Plan, execute, and ship. Kanban, milestones, risks, dependencies.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowNew(true)}
          leftIcon={
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          }
        >
          New project
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total projects"
          value={projects.length}
          icon={
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 9h6M9 13h6" />
            </svg>
          }
          gradient="from-brand-500 to-violet-500"
        />
        <StatCard
          label="Active"
          value={stats.active}
          icon={
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          }
          gradient="from-emerald-500 to-teal-500"
        />
        <StatCard
          label="On track"
          value={stats.onTrack}
          icon={
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
          gradient="from-sky-500 to-cyan-500"
        />
        <StatCard
          label="At risk"
          value={stats.atRisk}
          icon={
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 9v4M12 17v.01" />
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          }
          gradient="from-amber-500 to-orange-500"
        />
      </div>

      <Card>
        <CardBody className="flex flex-wrap items-center gap-2 !py-3">
          <div className="relative flex-1 min-w-[240px]">
            <Input
              placeholder="Search projects…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              }
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-auto min-w-[140px]"
          >
            <option value="">All statuses</option>
            {['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'].map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              )
            )}
          </Select>
          <div className="inline-flex rounded-md border border-border p-0.5 bg-surface-sunken">
            <button
              onClick={() => setView('grid')}
              className={[
                'px-3 h-8 rounded text-xs font-medium transition-colors',
                view === 'grid'
                  ? 'bg-surface-raised text-fg shadow-xs'
                  : 'text-fg-muted hover:text-fg',
              ].join(' ')}
            >
              Grid
            </button>
            <button
              onClick={() => setView('list')}
              className={[
                'px-3 h-8 rounded text-xs font-medium transition-colors',
                view === 'list'
                  ? 'bg-surface-raised text-fg shadow-xs'
                  : 'text-fg-muted hover:text-fg',
              ].join(' ')}
            >
              List
            </button>
          </div>
        </CardBody>
      </Card>

      {isLoading ? (
        <Spinner label="Loading projects..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="📋"
          title={projects.length === 0 ? 'No projects yet' : 'No matches'}
          description={
            projects.length === 0
              ? 'Create your first project to get started.'
              : 'Try a different filter or search.'
          }
          action={
            projects.length === 0 && (
              <Button variant="primary" onClick={() => setShowNew(true)}>
                Create project
              </Button>
            )
          }
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProjectCard key={p.id} p={p} onOpen={setOpenProject} />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-sunken text-fg-muted">
                <tr>
                  {[
                    'Project',
                    'Status',
                    'Health',
                    'Tasks',
                    'Progress',
                    'Due',
                  ].map((h) => (
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
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setOpenProject(p.id)}
                    className="hover:bg-surface-sunken/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-fg truncate max-w-xs">
                      {p.name}
                    </td>
                    <td className="px-4 py-3">
                      <Badge size="sm" tone={STATUS_TONE[p.status]} dot>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge size="sm" tone={HEALTH_TONE[p.health]} dot>
                        {p.health?.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-fg-muted tabular-nums">
                      {p.done_count || 0} / {p.task_count || 0}
                    </td>
                    <td className="px-4 py-3 w-32">
                      <Progress
                        value={p.progress}
                        tone={
                          p.progress >= 70
                            ? 'success'
                            : p.progress >= 40
                              ? 'warning'
                              : 'brand'
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-fg-muted">
                      {p.due_date ? formatDate(p.due_date) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showNew && <NewProjectModal onClose={() => setShowNew(false)} />}
    </div>
  );
}
