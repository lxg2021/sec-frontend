import { InvestigationNextReview } from "@/features/investigation-next-review/components/investigation-next-review"
import { loadInvestigationCasePlan } from "@/features/investigation-next-review/load-investigation-batch"

export const dynamic = "force-dynamic"

export default async function InvestigationPlanPage({
  searchParams,
}: {
  searchParams?: Promise<{ batch?: string | string[]; caseId?: string | string[]; case_id?: string | string[] }>
}) {
  const params = await searchParams
  const { batch, casePlan } = await loadInvestigationCasePlan({
    batch: params?.batch,
    caseId: params?.caseId ?? params?.case_id,
  })

  return <InvestigationNextReview batch={batch} casePlan={casePlan} />
}
