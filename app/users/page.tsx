import { redirect } from "next/navigation";
import { getCurrentUserAction } from "@/app/actions/auth";
import { listUsers } from "@/app/actions/user-admin";
import { UsersManageClient } from "@/components/features/manage/UsersManageClient";

export default async function UsersPage() {
  const user = await getCurrentUserAction();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/mine");

  const users = await listUsers();
  return <UsersManageClient users={users} />;
}
