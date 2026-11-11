"use client";
import { useRef, useState, type ReactNode } from "react";
import { Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
export function SidebarFrame({
  sidebar,
  header,
  children,
}: {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <div className="platform-frame min-h-screen" data-collapsed={collapsed}>
      <aside
        className="desktop-sidebar fixed inset-y-0 left-0 z-20 hidden flex-col border-r border-white/10 bg-sidebar px-5 py-7 lg:flex"
        aria-label="Navegação lateral"
      >
        {sidebar}
        <Button
          variant="ghost"
          className="mt-5 w-full justify-start text-white/75 hover:bg-white/10 hover:text-white"
          onClick={() => setCollapsed(!collapsed)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expandir navegação" : "Recolher navegação"}
          title={collapsed ? "Expandir navegação" : "Recolher navegação"}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          <span className="sidebar-label">Recolher menu</span>
        </Button>
      </aside>
      <dialog
        ref={dialog}
        aria-label="Navegação principal"
        className="mobile-navigation fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-[min(20rem,90vw)] max-w-none bg-sidebar p-5 text-white backdrop:bg-black/50"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
        onClose={() => trigger.current?.focus()}
      >
        <div className="mb-5 flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Fechar navegação"
            onClick={() => dialog.current?.close()}
            className="text-white hover:bg-white/10"
          >
            <X />
          </Button>
        </div>
        <div
          className="flex min-h-[calc(100%_-_4rem)] flex-col"
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a"))
              dialog.current?.close();
          }}
        >
          {sidebar}
        </div>
      </dialog>
      <div className="platform-body min-w-0">
        <header className="flex min-h-20 items-center gap-3 border-b bg-card px-4 sm:px-6 md:px-10">
          <Button
            ref={trigger}
            variant="outline"
            size="icon"
            className="shrink-0 lg:hidden"
            aria-label="Abrir navegação"
            aria-haspopup="dialog"
            onClick={() => dialog.current?.showModal()}
          >
            <Menu />
          </Button>
          {header}
        </header>
        {children}
      </div>
    </div>
  );
}
