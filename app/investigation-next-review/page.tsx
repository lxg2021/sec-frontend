import { InvestigationNextReview } from "@/features/investigation-next-review/components/investigation-next-review"
import { loadInvestigationBatch } from "@/features/investigation-next-review/load-investigation-batch"

export const dynamic = "force-dynamic"

export default async function InvestigationNextReviewPage({
  searchParams,
}: {
  searchParams?: Promise<{ batch?: string | string[] }>
}) {
  const params = await searchParams
  const batch = await loadInvestigationBatch(params?.batch)

  return <InvestigationNextReview batch={batch} />
}
