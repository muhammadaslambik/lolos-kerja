import Link from "next/link";

// Ruang panggilan Jitsi yang ditanam di dalam halaman website
export default function CallRoom({
  title,
  mode,
  src,
  newTabUrl,
  backHref,
}: {
  title: string;
  mode: "audio" | "video";
  src: string;
  newTabUrl: string;
  backHref: string;
}) {
  const label = mode === "audio" ? "Panggilan suara" : "Video call";
  return (
    <div className="max-w-5xl space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-extrabold">{title}</h1>
          <p className="text-xs text-ink/70">{label} lewat Jitsi. Jitsi membatasi satu rapat sampai 95 menit.</p>
        </div>
        <Link href={backHref} className="btn btn-ghost !py-1 text-sm">Keluar dari panggilan</Link>
      </div>
      <iframe
        title={label}
        src={src}
        allow="camera; microphone; display-capture; autoplay; fullscreen; clipboard-write"
        allowFullScreen
        className="h-[75vh] w-full rounded-lg border border-line bg-black"
      />
      <p className="text-xs text-ink/60">
        Kamera atau mikrofon tidak berfungsi, atau layar panggilan kosong?{" "}
        <a href={newTabUrl} target="_blank" rel="noopener noreferrer" className="underline">Buka panggilan di tab baru</a>.
      </p>
    </div>
  );
}
