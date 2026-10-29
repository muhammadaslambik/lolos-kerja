import { youtubeEmbedUrl, youtubeWatchUrl } from "@/lib/youtube";

export default function VideoEmbed({ id, title, label }: { id: string; title?: string | null; label: string }) {
  return (
    <figure className="mb-3">
      {title && <figcaption className="mb-1 text-sm font-semibold">{title}</figcaption>}
      <div className="overflow-hidden rounded-lg border border-line bg-black">
        <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
          <iframe
            src={youtubeEmbedUrl(id)}
            title={title || label}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
      <p className="mt-1 text-xs text-ink/60">
        Video tidak muncul? <a href={youtubeWatchUrl(id)} target="_blank" rel="noopener noreferrer" className="underline">Buka di YouTube</a>
      </p>
    </figure>
  );
}
