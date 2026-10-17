import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { rupiah } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kelas Pelatihan" };

const getCourses = unstable_cache(
  () =>
    db.course.findMany({
      where: { published: true },
      select: { id: true, title: true, description: true, category: true, price: true, passScore: true, _count: { select: { modules: true } } },
    }),
  ["courses-list"],
  { revalidate: 60, tags: ["courses"] },
);

export default async function Courses() {
  const courses = await getCourses();
  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold">Kelas pelatihan</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {courses.map((c) => (
          <div key={c.id} className="panel flex flex-col">
            <span className="tag self-start">{c.category}</span>
            <h2 className="mt-2 font-bold">{c.title}</h2>
            <p className="mt-1 flex-1 text-sm text-ink/70">{c.description}</p>
            <p className="mt-3 text-sm">{c._count.modules} modul. Nilai lulus {c.passScore}</p>
            <p className="mt-1 font-bold">{c.price === 0 ? "Gratis" : rupiah(c.price)}</p>
            <button className="btn btn-primary mt-3" disabled title="Pendaftaran kelas dibangun di fase berikutnya">Daftar kelas</button>
          </div>
        ))}
      </div>
    </div>
  );
}
