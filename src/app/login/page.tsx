import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getSession } from "@/lib/session";
import { dashboardPath } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "Masuk" };

export default async function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  const s = await getSession();
  if (s) redirect(dashboardPath(s.role));
  return <AuthForm mode="login" next={searchParams.next} />;
}
