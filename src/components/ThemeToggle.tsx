"use client";

export default function ThemeToggle() {
  function toggle() {
    const dark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("lk-theme", dark ? "dark" : "light");
    } catch {}
  }
  const icon = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <button type="button" onClick={toggle} className="btn btn-ghost !px-2.5 !py-2" aria-label="Ganti mode gelap atau terang" title="Ganti mode gelap atau terang">
      <svg viewBox="0 0 24 24" className="h-5 w-5 dark:hidden" {...icon}>
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
      <svg viewBox="0 0 24 24" className="hidden h-5 w-5 dark:block" {...icon}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
