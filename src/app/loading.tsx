export default function Loading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Memuat">
      <div className="h-9 w-1/3 rounded bg-line" />
      <div className="h-24 rounded-lg bg-line" />
      <div className="h-24 rounded-lg bg-line" />
      <div className="h-24 rounded-lg bg-line" />
    </div>
  );
}
