import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type StudioProjectRedirectPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function StudioProjectRedirectPage({
  params,
}: StudioProjectRedirectPageProps) {
  const { id } = await params;

  redirect(
    `/studio/editor/${encodeURIComponent(id)}`,
  );
}