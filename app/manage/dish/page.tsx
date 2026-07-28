import { redirect } from "next/navigation";
import { getCurrentUserAction } from "@/app/actions/auth";
import { fetchDishById } from "@/app/actions/dish-admin";
import { fetchMenuSnapshot } from "@/app/actions/menu";
import { DishForm } from "@/components/features/manage/DishForm";

export default async function DishEditPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const user = await getCurrentUserAction();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/mine");

  const { id } = await searchParams;
  const menu = await fetchMenuSnapshot();
  const dish = id ? await fetchDishById(id) : null;
  if (id && !dish) redirect("/manage");

  return <DishForm categories={menu.categories} dish={dish} />;
}
