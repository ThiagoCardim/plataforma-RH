import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/modules/access/server", () => ({ requirePermission: vi.fn() }));
import { requirePermission } from "@/modules/access/server";
import List from "@/app/(platform)/gente-gestao/pessoas/page";
import New from "@/app/(platform)/gente-gestao/pessoas/nova/page";
import Detail from "@/app/(platform)/gente-gestao/pessoas/[id]/page";
import Edit from "@/app/(platform)/gente-gestao/pessoas/[id]/editar/page";
import Layout from "@/app/(platform)/gente-gestao/pessoas/layout";
const guard = vi.mocked(requirePermission);
const pages = [
  () => List(),
  () => New(),
  () =>
    Detail({
      params: Promise.resolve({ id: "demo-1" }),
    }),
  () => Edit({ params: Promise.resolve({ id: "demo-1" }) }),
  () => Layout({ children: null }),
];
beforeEach(() => vi.resetAllMocks());
describe("every people route retains server authorization", () => {
  for (const [i, page] of pages.entries()) {
    it(`blocks route ${i} before rendering`, async () => {
      guard.mockRejectedValue(new Error("denied"));
      await expect(page()).rejects.toThrow("denied");
      expect(guard).toHaveBeenCalledWith("people.management.view");
    });
  }
  for (const role of ["hr", "director", "professional", "leadership"]) {
    it(`only allows local form operations for managerial roles: ${role}`, async () => {
      guard.mockResolvedValue({
        user: { id: "user" },
        organization: { id: "org" },
        roles: [role],
      } as Awaited<ReturnType<typeof requirePermission>>);
      const layout = await Layout({ children: null });
      expect(layout.props.canEdit).toBe(role === "hr" || role === "director");
      expect(layout.props.organizationId).toBe("org");
      expect(layout.key).toBe("user:org");
    });
  }
});
