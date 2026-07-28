import { redirect } from "next/navigation";
import { getCurrentUserAction } from "@/app/actions/auth";
import { MineClient } from "@/components/features/auth/MineClient";

export default async function MinePage() {
  const user = await getCurrentUserAction();
  if (!user) redirect("/login");
  return <MineClient user={user} />;
}
