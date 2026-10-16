import { Skeleton } from "@mairie360/lib-components/primitives";

export default function Loading() {
  return <main aria-busy="true" className="min-h-screen bg-[var(--mairie-background)] p-6 sm:p-10">
    <h1 className="text-3xl font-bold text-[var(--mairie-text)]">Paramètres</h1>
    <p role="status" className="mt-2 text-[var(--mairie-muted)]">Chargement des paramètres…</p>
    <div aria-hidden="true" className="mt-6 grid gap-5 md:grid-cols-2">
      {[0, 1, 2, 3].map(index => <div key={index} className="rounded-2xl bg-[var(--mairie-surface)] p-6 shadow-sm">
        <Skeleton className="mb-5 !h-5 !w-2/3 !bg-[var(--mairie-border)]" />
        <Skeleton className="mb-4 !h-11" />
        <Skeleton className="!h-11" />
      </div>)}
    </div>
  </main>;
}
