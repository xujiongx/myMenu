import { redirect } from "next/navigation";
import { getCurrentUserAction } from "@/app/actions/auth";
import { fetchCategoryById } from "@/app/actions/category";
import { CategoryForm } from "@/components/features/manage/CategoryForm";

export default async function CategoryFormPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const user = await getCurrentUserAction();
  if (!user) redirect("/login");

  const { id } = await searchParams;
  const category = id ? await fetchCategoryById(id) : null;
  if (id && !category) redirect("/categories");

  return <CategoryForm category={category} />;
}
