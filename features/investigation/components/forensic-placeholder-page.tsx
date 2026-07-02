type ForensicPlaceholderPageProps = {
  title: string
  description: string
}

export function ForensicPlaceholderPage({ title, description }: ForensicPlaceholderPageProps) {
  return (
    <main className="min-h-full bg-slate-50 p-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-950">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
      </section>
    </main>
  )
}
