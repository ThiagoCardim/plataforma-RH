import { getAccess } from "@/modules/access/server";
import { Shell } from "@/components/layout/shell";
export const dynamic = "force-dynamic";
export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await getAccess();
  return (
    <>
      <a
        href="#main-content"
        className="fixed left-4 top-2 z-50 -translate-y-20 rounded-lg bg-primary p-3 text-white focus:translate-y-0"
      >
        Pular para o conteúdo
      </a>
      <Shell access={access}>{children}</Shell>
    </>
  );
}
