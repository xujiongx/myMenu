import { redirect } from "next/navigation";
import { getCurrentUserAction } from "@/app/actions/auth";
import { fetchCategoriesForManage } from "@/app/actions/category";
import { CategoryManageClient } from "@/components/features/manage/CategoryManageClient";

export default async function CategoriesPage() {
  const user = await getCurrentUserAction();
  if (!user) redirect("/login");
  const categories = await fetchCategoriesForManage();
  return <CategoryManageClient categories={categories} />;
}
