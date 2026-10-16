import { db } from "@/lib/db";
import { rupiah } from "@/lib/constants";
export const dynamic = "force-dynamic";
export const metadata = { title: "Kelas Pelatihan" };

export default async function Courses() {
  const courses = await db.course.findMany({ where: { published: true }, include: { modules: true } });
  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold">Kelas pelatihan</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {courses.map((c) => (
          <div key={c.id} className="panel flex flex-col">
            <span className="tag self-start">{c.category}</span>
            <h2 className="mt-2 font-bold">{c.title}</h2>
            <p className="mt-1 flex-1 text-sm text-ink/70">{c.description}</p>
            <p className="mt-3 text-sm">{c.modules.length} modul. Nilai lulus {c.passScore}</p>
            <p className="mt-1 font-bold">{c.price === 0 ? "Gratis" : rupiah(c.price)}</p>
            <button className="btn btn-primary mt-3" disabled title="Pendaftaran kelas dibangun di fase berikutnya">Daftar kelas</button>
          </div>
        ))}
      </div>
    </div>
  );
}
