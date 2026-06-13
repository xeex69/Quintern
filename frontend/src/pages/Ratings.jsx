import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import useAuthStore from '../store/auth'
import RatingForm from '../components/RatingForm'
import { Banner, Card, CardBody, CardHeader, EmptyState, Select, Spinner, Stars, Skeleton } from '../components/ui'
import { isManager } from '../lib/constants'
import { formatDate } from '../lib/format'
import { EmptyStars } from '../components/illustrations'

export default function Ratings() {
  const { user } = useAuthStore()
  const canRate = isManager(user?.role)
  const [viewUserId, setViewUserId] = useState(user?.id || '')

  const { data: team = [] } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: () => api.get('/team/members').then((res) => res.data),
    enabled: canRate,
  })

  const { data: ratings, isLoading, error } = useQuery({
    queryKey: ['ratings', viewUserId],
    queryFn: () => api.get(`/ratings/${viewUserId}`).then((res) => res.data),
    enabled: !!viewUserId,
  })

  const avg = ratings?.length ? (ratings.reduce((a, r) => a + r.score, 0) / ratings.length).toFixed(1) : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Ratings</h1>
        <p className="text-sm text-fg-muted mt-1">Immutable history of performance scores on a 1-10 scale.</p>
      </div>

      {canRate && <RatingForm />}

      <Card>
        <CardBody className="flex flex-wrap items-end justify-between gap-4 !py-4">
          <div>
            <label htmlFor="rating-view" className="block text-xs font-medium text-fg-muted mb-1.5">View ratings of</label>
            {canRate ? (
              <Select id="rating-view" value={viewUserId} onChange={(e) => setViewUserId(e.target.value)} className="max-w-md">
                <option value={user?.id}>Me ({user?.email})</option>
                {team.map((m) => <option key={m.id} value={m.id}>{m.full_name || m.email} ({m.role})</option>)}
              </Select>
            ) : (
              <p className="text-sm text-fg">My ratings</p>
            )}
          </div>
          {avg && (
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <Stars value={Number(avg)} max={10} />
                <span className="text-2xl font-semibold text-fg tabular-nums">{avg}<span className="text-sm text-fg-muted">/10</span></span>
              </div>
              <p className="text-xs text-fg-muted">avg of {ratings.length} ratings</p>
            </div>
          )}
        </CardBody>
      </Card>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Card key={i}><CardBody className="space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-2/3" /></CardBody></Card>
          ))}
        </div>
      ) : error ? (
        <Banner kind="error">{error.response?.data?.error || 'Failed to load ratings'}</Banner>
      ) : !ratings?.length ? (
        <EmptyState
          illustration={<EmptyStars />}
          title="No ratings yet"
          description={canRate ? 'Rate your team on a 1–10 scale. Every rating is immutable and audit-logged.' : 'Ratings submitted to you will show up here.'}
          action={canRate && <RatingForm />}
        />
      ) : (
        <div className="space-y-2">
          {ratings.map((r) => (
            <Card key={r.id} className="lift">
              <CardBody>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Stars value={r.score} max={10} />
                    <span className="text-sm font-semibold text-fg tabular-nums">{r.score}/10</span>
                    {r.category && <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted bg-surface-sunken rounded px-1.5 py-0.5">{r.category}</span>}
                  </div>
                  <span className="text-xs text-fg-muted tabular-nums">{formatDate(r.created_at)}</span>
                </div>
                {r.remarks && <p className="text-sm text-fg-muted mt-2 italic">"{r.remarks}"</p>}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
