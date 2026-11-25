import "server-only";
import { type Scope } from "../career/model";
import {
  type CultureState,
  type Section,
  type Item,
  projection,
} from "./model";
const item = (
  id: string,
  title: string,
  subtitle = "Conteúdo oficial a inserir pelo RH",
  group = "",
): Item => ({ id, title, subtitle, group, date: "", blocks: [] });
export function demoCulture(c: Scope): CultureState {
  const sections: Section[] = [
    [
      "intro",
      "Apresentação",
      "Um movimento. Muitas possibilidades.",
      "QUEM SOMOS",
      "Um espaço para conhecer a YouCon e o que queremos construir juntos.",
      "Clara",
      true,
      [
        item(
          "about",
          "A YouCon",
          "Apresentação institucional a inserir a partir do Manual de Cultura.",
        ),
      ],
    ],
    [
      "pillars",
      "Pilares",
      "O que nos move",
      "DIREÇÃO E SIGNIFICADO",
      "Missão, visão e propósito reunidos em um só lugar.",
      "Escura",
      true,
      [
        item("mission", "Missão"),
        item("vision", "Visão"),
        item("purpose", "Propósito"),
      ],
    ],
    [
      "founders",
      "Fundadores",
      "De quem começou. Para quem continua.",
      "CARTAS DOS FUNDADORES",
      "Fotografias e mensagens oficiais terão lugar de destaque aqui.",
      "Clara",
      true,
      [
        item(
          "founder-1",
          "Carta de um fundador",
          "Nome, fotografia real e mensagem a inserir.",
        ),
        item(
          "founder-2",
          "Carta de uma fundadora ou fundador",
          "Espaço personalizável, sem identificação presumida.",
        ),
      ],
    ],
    [
      "values",
      "Valores",
      "Valores que ganham vida nas escolhas",
      "NOSSA ESSÊNCIA",
      "Do alicerce às atitudes do dia a dia.",
      "Clara",
      false,
      [
        item(
          "ownership",
          "Postura de Dono",
          "Explicação oficial e exemplos práticos a inserir.",
          "Alicerce da cultura",
        ),
        item(
          "improve",
          "Melhoria Contínua",
          "Explicação oficial e exemplos práticos a inserir.",
          "Alicerce da cultura",
        ),
        item(
          "attitude",
          "Atitude",
          "Explicação oficial e exemplos práticos a inserir.",
          "Como vivemos na prática",
        ),
        item(
          "growth",
          "Sede de Crescimento",
          "Explicação oficial e exemplos práticos a inserir.",
          "Como vivemos na prática",
        ),
        item(
          "loyalty",
          "Lealdade",
          "Explicação oficial e exemplos práticos a inserir.",
          "Como vivemos na prática",
        ),
      ],
    ],
    [
      "limits",
      "Limites",
      "O que não faz parte da nossa cultura",
      "ESCOLHAS COM CONSCIÊNCIA",
      "Comportamentos e orientações devem refletir o manual aprovado.",
      "Escura",
      false,
      [],
    ],
    [
      "rituals",
      "Rituais",
      "Nossa energia, do nosso jeito",
      "CONEXÕES QUE NOS UNEM",
      "Um espaço vivo para os rituais da YouCon.",
      "Laranja",
      false,
      [
        item("ritual", "Rituais"),
        item("mantra", "Mantras"),
        item("cry", "Grito de guerra"),
        item(
          "pose",
          "Pose oficial",
          "Inserir fotografia ou vídeo real e instruções oficiais.",
        ),
      ],
    ],
    [
      "goals",
      "Metas",
      "Ambição que aponta uma direção",
      "METAS INSTITUCIONAIS",
      "Critérios e números serão preenchidos pela gestão. Nenhum resultado foi presumido.",
      "Clara",
      false,
      [item("titan", "Titã"), item("hero", "Hero"), item("olympus", "Olimpo")],
    ],
    [
      "journey",
      "Jornada",
      "1.000 novas construções até 2030",
      "UM HORIZONTE PARA CONSTRUIR",
      "Objetivo informado para esta página. Avanço atual ainda não cadastrado.",
      "Escura",
      true,
      [
        {
          ...item(
            "2030",
            "Novas construções",
            "Objetivo até 2030 · resultado atual a informar",
          ),
          target: 1000,
        },
      ],
    ],
    [
      "history",
      "Timeline",
      "A história que estamos construindo",
      "NOSSA TRAJETÓRIA",
      "Marcos históricos aguardam o material institucional.",
      "Clara",
      true,
      [],
    ],
    [
      "gallery",
      "Galeria",
      "Momentos que merecem ficar",
      "NOSSO ÁLBUM",
      "Fotografias, vídeos, eventos e conquistas reais serão inseridos pelo RH.",
      "Clara",
      true,
      [
        item(
          "photo-1",
          "Fotografia da equipe",
          "Espaço reservado para fotografia real.",
        ),
        item(
          "event-1",
          "Eventos e conquistas",
          "Adicione a história e os registros autorizados.",
        ),
      ],
    ],
    [
      "stories",
      "Histórias",
      "Cultura na prática",
      "VOZES DA EQUIPE",
      "Histórias reais, com contexto e autorização de publicação.",
      "Laranja",
      false,
      [],
    ],
    [
      "hall",
      "Hall",
      "Quem faz a cultura acontecer",
      "DESTAQUE CULTURAL",
      "Reconhecimentos já publicados no Hall, sem duplicar avaliações ou criar novos vencedores.",
      "Escura",
      false,
      [],
    ],
  ].map((row) => {
    const [id, layout, title, eyebrow, summary, theme, partnerRelevant, items] =
      row as [
        string,
        Section["layout"],
        string,
        string,
        string,
        Section["theme"],
        boolean,
        Item[],
      ];
    return {
      id,
      layout,
      title,
      eyebrow,
      summary,
      theme,
      partnerRelevant,
      contracts: partnerRelevant
        ? ["CLT", "Estágio", "PJ"]
        : ["CLT", "Estágio"],
      items,
      blocks: [],
      visible: true,
    };
  });
  return projection(
    {
      version: 1,
      org: c.org,
      versions: [
        {
          id: "culture-initial",
          number: 1,
          by: "Estrutura demonstrativa",
          at: "2026-11-25T12:00:00Z",
          note: "Estrutura baseada apenas no pedido. Manual oficial não disponibilizado.",
          content: {
            hero: {
              kicker: "YOUCON · NOSSA CULTURA",
              title:
                "Você não entrou para uma empresa. Você entrou para um movimento.",
              subtitle:
                "Pertencimento, orgulho e propósito. Um espaço para conhecer, viver e compartilhar a nossa história.",
            },
            sections,
            manual: {
              title: "Manual de Cultura YouCon",
              version: 1,
              ready: false,
              chapters: [],
            },
          },
        },
      ],
      events: [],
    },
    c,
  );
}
