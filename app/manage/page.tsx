import { redirect } from "next/navigation";
import { getCurrentUserAction } from "@/app/actions/auth";
import { fetchDishesForManage } from "@/app/actions/dish-admin";
import { fetchMenuSnapshot } from "@/app/actions/menu";
import { ManageClient } from "@/components/features/manage/ManageClient";

export default async function ManagePage() {
  const user = await getCurrentUserAction();
  if (!user) redirect("/login");

  const [{ dishes }, menu] = await Promise.all([
    fetchDishesForManage(),
    fetchMenuSnapshot(),
  ]);

  return <ManageClient dishes={dishes} categories={menu.categories} />;
}
