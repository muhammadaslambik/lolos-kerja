import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getSession } from "@/lib/session";
import { dashboardPath } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "Daftar" };

export default async function RegisterPage() {
  const s = await getSession();
  if (s) redirect(dashboardPath(s.role));
  return <AuthForm mode="register" />;
}
