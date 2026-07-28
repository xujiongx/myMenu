import { redirect } from "next/navigation";
import { getCurrentUserAction } from "@/app/actions/auth";
import { fetchUserById } from "@/app/actions/user-admin";
import { UserForm } from "@/components/features/manage/UserForm";

export default async function UserFormPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const user = await getCurrentUserAction();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/mine");

  const { id } = await searchParams;
  const target = id ? await fetchUserById(id) : null;
  if (id && !target) redirect("/users");
  if (target?.protected) redirect("/users");

  return <UserForm user={target} />;
}
