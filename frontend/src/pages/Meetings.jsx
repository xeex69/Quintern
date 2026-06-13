import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/axios'
import useAuthStore from '../store/auth'
import { Avatar, Badge, Banner, Button, Card, CardBody, CardHeader, ConfirmDialog, EmptyState, Input, Modal, Spinner, Textarea } from '../components/ui'
import { formatDate, formatDateTime, fullName } from '../lib/format'
import { useFlash } from '../lib/useFlash'
import { EmptyCalendar } from '../components/illustrations'

export default function Meetings() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', meetingDate: '', startTime: '', endTime: '' })
  const [attendees, setAttendees] = useState([])
  const { message, error, flash, flashError } = useFlash(3000)

  const canCreate = ['ADMIN', 'SENIOR_TL', 'TL'].includes(user?.role)

  const { data: meetings, isLoading } = useQuery({
    queryKey: ['meetings'],
    queryFn: () => api.get('/meetings').then((res) => res.data),
  })
  const { data: team = [] } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: () => api.get('/team/members').then((res) => res.data),
    enabled: canCreate,
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/meetings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
      setShowForm(false)
      setForm({ title: '', description: '', meetingDate: '', startTime: '', endTime: '' })
      setAttendees([])
      flash('Meeting scheduled')
    },
    onError: (e) => flashError(e.response?.data?.error || 'Failed to schedule'),
  })
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/meetings/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['meetings'] }); flash('Meeting deleted'); setConfirmDelete(null) },
    onError: (e) => flashError(e.response?.data?.error || 'Delete failed'),
  })

  const toggle = (id) => setAttendees((a) => a.includes(id) ? a.filter((x) => x !== id) : [...a, id])
  const handleSubmit = (e) => {
    e.preventDefault()
    createMutation.mutate({ ...form, attendeeIds: attendees })
  }

  // Group meetings by upcoming / past
  const now = new Date();
  const upcoming = (meetings || []).filter((m) => new Date(m.meeting_date) >= now);
  const past = (meetings || []).filter((m) => new Date(m.meeting_date) < now);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Meetings</h1>
          <p className="text-sm text-fg-muted mt-1">Schedule and track team meetings.</p>
        </div>
        {canCreate && (
          <Button variant="primary" onClick={() => setShowForm((s) => !s)} leftIcon={<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>}>
            {showForm ? 'Close' : 'Schedule meeting'}
          </Button>
        )}
      </div>

      {message && <Banner kind="success">{message}</Banner>}
      {error && <Banner kind="error">{error}</Banner>}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Schedule a meeting" size="lg"
             footer={
               <>
                 <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                 <Button variant="primary" onClick={handleSubmit} loading={createMutation.isPending}>Schedule</Button>
               </>
             }>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Engineering weekly sync" />
          <Textarea label="Description / agenda" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Date" type="date" required value={form.meetingDate} onChange={(e) => setForm({ ...form, meetingDate: e.target.value })} />
            <Input label="Start" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            <Input label="End" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          </div>
          {team.length > 0 && (
            <div>
              <p className="text-xs font-medium text-fg-muted mb-1.5">Attendees ({attendees.length} selected)</p>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-auto p-1" role="group" aria-label="Attendees">
                {team.map((m) => {
                  const selected = attendees.includes(m.id);
                  return (
                    <button type="button" key={m.id} onClick={() => toggle(m.id)}
                            aria-pressed={selected}
                            className={['px-2.5 h-7 rounded-full text-xs font-medium transition-colors border', selected ? 'bg-fg text-fg-inverse border-fg' : 'bg-surface-base text-fg-muted border-border hover:border-border-strong'].join(' ')}>
                      {m.full_name || m.email}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </form>
      </Modal>

      {isLoading ? <Spinner label="Loading meetings..." /> : !meetings?.length ? (
        <EmptyState
          illustration={<EmptyCalendar />}
          title="No meetings scheduled"
          description={canCreate ? 'Click "Schedule meeting" to create your first one and invite attendees.' : 'New meetings will appear here once your team schedules them.'}
        />
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-fg-muted mb-3">Upcoming · {upcoming.length}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcoming.map((m) => <MeetingCard key={m.id} m={m} onDelete={() => setConfirmDelete(m)} canDelete={m.created_by === user?.id} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-fg-muted mb-3">Past · {past.length}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {past.map((m) => <MeetingCard key={m.id} m={m} onDelete={() => setConfirmDelete(m)} canDelete={m.created_by === user?.id} />)}
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete meeting?"
        message={confirmDelete ? `Permanently delete "${confirmDelete.title}"?` : ''}
        confirmLabel="Delete" danger
        onConfirm={() => deleteMutation.mutate(confirmDelete.id)}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  )
}

function MeetingCard({ m, onDelete, canDelete }) {
  return (
    <Card className="lift">
      <CardBody>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 w-10 h-10 rounded-md bg-gradient-to-br from-brand-500 to-violet-600 text-white flex items-center justify-center text-lg">📹</div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-fg truncate">{m.title}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge size="sm" tone="brand">{formatDate(m.meeting_date)}</Badge>
                {m.start_time && <Badge size="sm">{m.start_time}{m.end_time ? ` – ${m.end_time}` : ''}</Badge>}
              </div>
            </div>
          </div>
          {canDelete && (
            <button onClick={onDelete} className="text-fg-muted hover:text-danger-600 transition-colors p-1" title="Delete" aria-label={`Delete ${m.title}`}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" /></svg>
            </button>
          )}
        </div>
        {m.description && <p className="text-sm text-fg-muted mt-3 leading-relaxed">{m.description}</p>}
      </CardBody>
    </Card>
  )
}
