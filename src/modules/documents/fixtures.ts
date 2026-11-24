import "server-only";
import {
  type Document,
  type Content,
  readable,
  readerProjection,
} from "./model";
export function demoDocuments(manager: boolean, audience: string): Document[] {
  const titles: Record<string, string[]> = {
    "politicas-internas": [
      "Trabalho remoto e colaboração",
      "Convivência e uso dos espaços",
      "Comunicação e canais internos",
      "Integração de novas pessoas",
      "Diretrizes de despesas",
      "Segurança nos ambientes",
    ],
    compliance: [
      "Código de conduta e integridade",
      "Conflitos de interesse",
      "Privacidade e proteção de dados",
      "Relacionamento com fornecedores",
      "Canal de ética e acolhimento",
      "Presentes e hospitalidades",
    ],
  };
  const docs = Object.entries(titles).flatMap(([library, names]) =>
    names.map((title, i) => {
      const content: Content = {
        title,
        category:
          library === "compliance"
            ? ["Integridade", "Governança", "Privacidade"][i % 3]
            : ["Rotina de trabalho", "Pessoas", "Comunicação"][i % 3],
        audience:
          i === 1
            ? library === "compliance"
              ? ["PJ"]
              : ["CLT", "Estágio"]
            : i === 3
              ? ["CLT", "Estágio"]
              : i === 4
                ? ["PJ"]
                : ["CLT", "Estágio", "PJ"],
        tags: [i === 2 ? "Orientação" : "Institucional"],
        status: (
          [
            "Ativa",
            "Ativa",
            "Em revisão",
            "Em implantação",
            "Rascunho",
            "Arquivada",
          ] as const
        )[i],
        requireRead: i === 0,
        attachments: [],
        blocks: [
          { id: "a", type: "title", text: "Objetivo e abrangência" },
          {
            id: "b",
            type: "text",
            text: `Documento fictício para explorar a central YouCon People. ${title}: orientações ilustrativas, sem valor de norma oficial. As disposições para CLT, estágio e prestação PJ devem respeitar a natureza de cada relação.`,
          },
          {
            id: "c",
            type: "list",
            text: "Conheça as orientações aplicáveis ao seu público\nConverse com o responsável em caso de dúvida\nConsulte a versão publicada antes de utilizar uma diretriz",
          },
          {
            id: "d",
            type: "table",
            text: "Etapa | Responsável\nOrientação | RH\nRevisão | Diretoria",
          },
          {
            id: "e",
            type: "title",
            text: "Responsabilidades e acompanhamento",
          },
          {
            id: "f",
            type: "text",
            text: "O RH acompanha a comunicação das orientações e a Diretoria participa de sua revisão. Este conteúdo é inteiramente demonstrativo.",
          },
        ],
      };
      return {
        ...content,
        id: `${library}-${i + 1}`,
        library: "politicas-compliance" as const,
        versions: [
          {
            number: 1,
            at: "2026-11-23T12:00:00Z",
            author: "Equipe fictícia de RH",
            changes: ["Versão demonstrativa inicial"],
            content,
          },
        ],
        published:
          content.status === "Ativa" ? structuredClone(content) : undefined,
      };
    }),
  );
  return manager
    ? docs
    : docs.filter((d) => readable(d, audience)).map(readerProjection);
}
