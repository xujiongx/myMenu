import { redirect } from "next/navigation";
import { getCurrentUserAction } from "@/app/actions/auth";
import { fetchOrderStats } from "@/app/actions/stats";
import { StatsClient } from "@/components/features/stats/StatsClient";

export default async function StatsPage() {
  const user = await getCurrentUserAction();
  if (!user) redirect("/login");
  const stats = await fetchOrderStats();
  return <StatsClient stats={stats} />;
}
