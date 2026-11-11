export function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <div
      aria-label="YouCon People — identidade visual oficial pendente"
      className={dark ? "text-white" : "text-foreground"}
    >
      <span className="text-xl font-bold tracking-tight">
        YouCon <span className="font-normal">People</span>
      </span>
      <p className="mt-1 text-[10px] uppercase tracking-[0.23em] opacity-60">
        Arquitetura e Engenharia
      </p>
    </div>
  );
}
