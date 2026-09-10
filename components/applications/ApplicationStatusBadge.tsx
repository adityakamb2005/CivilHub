import type { OpportunityApplication } from '@/types'

const labels: Record<OpportunityApplication['status'], string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
}

const styles: Record<OpportunityApplication['status'], string> = {
  pending: 'ch-badge-orange',
  accepted: 'ch-badge-green',
  rejected: 'bg-[var(--color-ch-red-light)] text-[var(--color-ch-red)]',
  withdrawn: 'ch-badge-gray',
}

export function ApplicationStatusBadge({ status }: { status: OpportunityApplication['status'] }) {
  return <span className={`ch-badge ${styles[status]}`}>{labels[status]}</span>
}
