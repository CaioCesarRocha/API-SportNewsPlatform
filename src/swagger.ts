import { OpenAPIV3 } from "openapi-types";

export const swaggerSpec: OpenAPIV3.Document = {
  openapi: "3.0.0",
  info: {
    title: "SportNewsPlatform API",
    version: "1.0.0",
    description: "API da plataforma de notícias esportivas",
  },
  servers: [{ url: "http://localhost:3000", description: "Desenvolvimento" }],
  paths: {
    "/health": {
      get: {
        summary: "Verifica se a API está online",
        tags: ["Health"],
        responses: {
          "200": {
            description: "API online",
            content: {
              "text/plain": {
                schema: { type: "string", example: "API PING - ONLINE" },
              },
            },
          },
        },
      },
    },
    "/clubs": {
      post: {
        summary: "Cria um novo clube",
        tags: ["Clubs"],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["shield", "name", "country", "stadium"],
                properties: {
                  shield: {
                    type: "string",
                    format: "binary",
                    description: "Imagem do escudo (PNG, JPEG ou WebP, max 5MB)",
                  },
                  name: {
                    type: "string",
                    description: "Nome do clube",
                    example: "Sociedade Esportiva Palmeiras",
                  },
                  country: {
                    type: "string",
                    description: "País do clube",
                    example: "Brasil",
                  },
                  state: {
                    type: "string",
                    description: "Estado do clube (opcional)",
                    example: "São Paulo",
                  },
                  stadium: {
                    type: "string",
                    description: "Estádio do clube",
                    example: "Allianz Parque",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Clube criado com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ClubResponse" },
              },
            },
          },
          "400": { description: "Erro de validação" },
          "409": { description: "Conflito — clube com este nome já existe" },
          "500": { description: "Erro interno do servidor" },
          "502": { description: "Erro ao fazer upload da imagem" },
        },
      },
      get: {
        summary: "Lista todos os clubes com seus títulos",
        tags: ["Clubs"],
        responses: {
          "200": {
            description: "Lista de clubes",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/ClubWithTitles" },
                },
              },
            },
          },
          "500": { description: "Erro interno do servidor" },
        },
      },
    },
    "/clubs/{id}": {
      put: {
        summary: "Atualiza um clube existente",
        tags: ["Clubs"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" },
            description: "ID público do clube",
            example: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["name", "country", "stadium"],
                properties: {
                  shield: {
                    type: "string",
                    format: "binary",
                    description: "Imagem do escudo (PNG, JPEG ou WebP, max 5MB) — opcional",
                  },
                  name: {
                    type: "string",
                    description: "Nome do clube",
                    example: "Sociedade Esportiva Palmeiras",
                  },
                  country: {
                    type: "string",
                    description: "País do clube",
                    example: "Brasil",
                  },
                  state: {
                    type: "string",
                    description: "Estado do clube (opcional)",
                    example: "São Paulo",
                  },
                  stadium: {
                    type: "string",
                    description: "Estádio do clube",
                    example: "Allianz Parque",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Clube atualizado com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ClubResponse" },
              },
            },
          },
          "400": { description: "Erro de validação" },
          "404": { description: "Clube não encontrado" },
          "409": { description: "Conflito — já existe outro clube com este nome" },
          "500": { description: "Erro interno do servidor" },
          "502": { description: "Erro ao fazer upload da imagem" },
        },
      },
    },
    "/clubs/location/{country}/{state}": {
      get: {
        summary: "Lista clubes por localização (país e estado)",
        tags: ["Clubs"],
        parameters: [
          {
            in: "path",
            name: "country",
            required: true,
            schema: { type: "string" },
            description: "País dos clubes",
            example: "Brasil",
          },
          {
            in: "path",
            name: "state",
            required: true,
            schema: { type: "string" },
            description: "Estado dos clubes",
            example: "São Paulo",
          },
        ],
        responses: {
          "200": {
            description: "Lista de clubes filtrados por localização",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/ClubResponse" },
                },
              },
            },
          },
          "500": { description: "Erro interno do servidor" },
        },
      },
    },
    "/championships": {
      post: {
        summary: "Cria um novo campeonato",
        tags: ["Championships"],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["emblem", "name", "type", "weight", "clubsCount", "clubs"],
                properties: {
                  emblem: {
                    type: "string",
                    format: "binary",
                    description: "Imagem do emblema (PNG, JPEG ou WebP, max 5MB)",
                  },
                  name: {
                    type: "string",
                    description: "Nome do campeonato",
                    example: "Campeonato Brasileiro Série A",
                  },
                  type: {
                    type: "string",
                    enum: ["elimination rounds", "league", "mixed", "groups"],
                    description: "Tipo do campeonato",
                    example: "league",
                  },
                  weight: {
                    type: "integer",
                    minimum: 1,
                    maximum: 7,
                    description: "Peso/importância do campeonato (1-7)",
                    example: 7,
                  },
                  clubsCount: {
                    type: "integer",
                    minimum: 1,
                    description: "Quantidade de clubes participantes",
                    example: 20,
                  },
                  clubs: {
                    type: "string",
                    description: "JSON array com os publicIds dos clubes participantes",
                    example: '["a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6","b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6a"]',
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Campeonato criado com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Championship" },
              },
            },
          },
          "400": { description: "Erro de validação" },
          "409": { description: "Conflito — campeonato com este nome já existe" },
          "500": { description: "Erro interno do servidor" },
          "502": { description: "Erro ao fazer upload da imagem" },
        },
      },
      get: {
        summary: "Lista todos os campeonatos",
        tags: ["Championships"],
        parameters: [
          {
            in: "query",
            name: "name",
            required: false,
            schema: { type: "string" },
            description: "Filtro por nome do campeonato (busca parcial)",
            example: "Brasileiro",
          },
        ],
        responses: {
          "200": {
            description: "Lista de campeonatos",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Championship" },
                },
              },
            },
          },
          "500": { description: "Erro interno do servidor" },
        },
      },
    },
    "/championships/{id}": {
      put: {
        summary: "Atualiza um campeonato existente (name, weight e emblem)",
        tags: ["Championships"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer", minimum: 1 },
            description: "ID do campeonato",
            example: 1,
          },
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["name", "weight"],
                properties: {
                  emblem: {
                    type: "string",
                    format: "binary",
                    description: "Imagem do emblema (PNG, JPEG ou WebP, max 5MB) — opcional",
                  },
                  name: {
                    type: "string",
                    description: "Nome do campeonato",
                    example: "Campeonato Brasileiro Série A",
                  },
                  weight: {
                    type: "integer",
                    minimum: 1,
                    maximum: 7,
                    description: "Peso/importância do campeonato (1-7)",
                    example: 7,
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Campeonato atualizado com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Championship" },
              },
            },
          },
          "400": { description: "Erro de validação" },
          "404": { description: "Campeonato não encontrado" },
          "409": { description: "Conflito — já existe outro campeonato com este nome" },
          "500": { description: "Erro interno do servidor" },
          "502": { description: "Erro ao fazer upload da imagem" },
        },
      },
      get: {
        summary: "Busca um campeonato pelo ID",
        tags: ["Championships"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer", minimum: 1 },
            description: "ID do campeonato",
            example: 1,
          },
        ],
        responses: {
          "200": {
            description: "Campeonato encontrado com clubes",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ChampionshipWithClubs" },
              },
            },
          },
          "404": { description: "Campeonato não encontrado" },
          "500": { description: "Erro interno do servidor" },
        },
      },
    },
    "/rounds": {
      post: {
        summary: "Cria uma nova rodada/partida",
        tags: ["Rounds"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "championshipId",
                  "identifier",
                  "homeTeamId",
                  "visitTeamId",
                  "homeGoals",
                  "visitGoals",
                  "date",
                  "phase",
                ],
                properties: {
                  championshipId: {
                    type: "integer",
                    description: "ID do campeonato",
                    example: 1,
                  },
                  identifier: {
                    type: "string",
                    description: "Identificador da rodada",
                    example: "1ª rodada",
                  },
                  homeTeamId: {
                    type: "string",
                    description: "Public ID do time da casa",
                    example: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
                  },
                  visitTeamId: {
                    type: "string",
                    description: "Public ID do time visitante",
                    example: "b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6a",
                  },
                  homeGoals: {
                    type: "integer",
                    minimum: 0,
                    description: "Gols do time da casa",
                    example: 2,
                  },
                  visitGoals: {
                    type: "integer",
                    minimum: 0,
                    description: "Gols do time visitante",
                    example: 1,
                  },
                  date: {
                    type: "string",
                    format: "date-time",
                    description: "Data e hora da partida (ISO datetime)",
                    example: "2026-05-28T20:00:00.000Z",
                  },
                  phase: {
                    type: "string",
                    description: "Fase do campeonato",
                    example: "Fase de Grupos",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Rodada criada com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RoundResponse" },
              },
            },
          },
          "400": { description: "Erro de validação" },
          "500": { description: "Erro interno do servidor" },
        },
      },
    },
    "/rounds/{id}": {
      put: {
        summary: "Atualiza uma rodada/partida existente",
        tags: ["Rounds"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer", minimum: 1 },
            description: "ID da rodada",
            example: 1,
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  identifier: {
                    type: "string",
                    description: "Identificador da rodada (opcional)",
                    example: "1ª rodada",
                  },
                  homeTeamId: {
                    type: "string",
                    description: "Public ID do time da casa (opcional)",
                    example: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
                  },
                  visitTeamId: {
                    type: "string",
                    description: "Public ID do time visitante (opcional)",
                    example: "b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6a",
                  },
                  homeGoals: {
                    type: "integer",
                    minimum: 0,
                    description: "Gols do time da casa (opcional)",
                    example: 2,
                  },
                  visitGoals: {
                    type: "integer",
                    minimum: 0,
                    description: "Gols do time visitante (opcional)",
                    example: 1,
                  },
                  date: {
                    type: "string",
                    format: "date-time",
                    description: "Data e hora da partida ISO datetime (opcional)",
                    example: "2026-05-28T20:00:00.000Z",
                  },
                  phase: {
                    type: "string",
                    description: "Fase do campeonato (opcional)",
                    example: "Fase de Grupos",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Rodada atualizada com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RoundResponse" },
              },
            },
          },
          "400": { description: "Erro de validação" },
          "500": { description: "Erro interno do servidor" },
        },
      },
    },
    "/rounds/{championshipId}": {
      get: {
        summary: "Lista rodadas por campeonato (e opcionalmente por identificador)",
        tags: ["Rounds"],
        parameters: [
          {
            in: "path",
            name: "championshipId",
            required: true,
            schema: { type: "integer", minimum: 1 },
            description: "ID do campeonato",
            example: 1,
          },
          {
            in: "query",
            name: "identifier",
            required: false,
            schema: { type: "string" },
            description: "Identificador da rodada (opcional — se omitido, retorna todas as rodadas do campeonato)",
            example: "1ª rodada",
          },
        ],
        responses: {
          "200": {
            description: "Lista de rodadas encontradas",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/RoundResponse" },
                },
              },
            },
          },
          "500": { description: "Erro interno do servidor" },
        },
      },
    },
  },
  components: {
    schemas: {
      ClubResponse: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          country: { type: "string" },
          state: { type: "string", nullable: true },
          shield: { type: "string" },
          stadium: { type: "string" },
        },
        example: {
          id: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
          name: "Sociedade Esportiva Palmeiras",
          country: "Brasil",
          state: "São Paulo",
          shield: "https://ik.imagekit.io/sportnews/clubs/shields/palmeiras.jpg",
          stadium: "Allianz Parque",
        },
      },
      ClubTitle: {
        type: "object",
        properties: {
          titlesCount: { type: "integer" },
          championship: {
            type: "object",
            properties: {
              id: { type: "integer" },
              name: { type: "string" },
              type: { type: "string", enum: ["elimination rounds", "league", "mixed", "groups"] },
              weight: { type: "integer" },
              emblem: { type: "string" },
              clubsCount: { type: "integer" },
            },
          },
        },
      },
      ClubWithTitles: {
        allOf: [
          { $ref: "#/components/schemas/ClubResponse" },
          {
            type: "object",
            properties: {
              titles: {
                type: "array",
                items: { $ref: "#/components/schemas/ClubTitle" },
              },
            },
          },
        ],
        example: {
          id: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
          name: "Sociedade Esportiva Palmeiras",
          country: "Brasil",
          state: "São Paulo",
          shield: "https://ik.imagekit.io/sportnews/clubs/shields/palmeiras.jpg",
          stadium: "Allianz Parque",
          titles: [
            {
              titlesCount: 3,
              championship: {
                id: 1,
                name: "Campeonato Brasileiro Série A",
                type: "league",
                weight: 7,
                emblem: "https://ik.imagekit.io/sportnews/championships/emblems/brasileirao.jpg",
                clubsCount: 20,
              },
            },
          ],
        },
      },
      Championship: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          type: { type: "string", enum: ["elimination rounds", "league", "mixed", "groups"] },
          weight: { type: "integer" },
          emblem: { type: "string" },
          clubsCount: { type: "integer" },
        },
        example: {
          id: 1,
          name: "Campeonato Brasileiro Série A",
          type: "league",
          weight: 7,
          emblem: "https://ik.imagekit.io/sportnews/championships/emblems/brasileirao.jpg",
          clubsCount: 20,
        },
      },
      ChampionshipWithClubs: {
        allOf: [
          { $ref: "#/components/schemas/Championship" },
          {
            type: "object",
            properties: {
              clubs: {
                type: "array",
                items: { $ref: "#/components/schemas/ClubResponse" },
              },
            },
          },
        ],
        example: {
          id: 1,
          name: "Campeonato Brasileiro Série A",
          type: "league",
          weight: 7,
          emblem: "https://ik.imagekit.io/sportnews/championships/emblems/brasileirao.jpg",
          clubsCount: 20,
          clubs: [
            {
              id: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
              name: "Sociedade Esportiva Palmeiras",
              country: "Brasil",
              state: "São Paulo",
              shield: "https://ik.imagekit.io/sportnews/clubs/shields/palmeiras.jpg",
              stadium: "Allianz Parque",
            },
          ],
        },
      },
      RoundClub: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          country: { type: "string" },
          state: { type: "string", nullable: true },
          shield: { type: "string" },
          stadium: { type: "string" },
        },
      },
      RoundResponse: {
        type: "object",
        properties: {
          id: { type: "integer" },
          championshipId: { type: "integer" },
          identifier: { type: "string" },
          homeGoals: { type: "integer" },
          visitGoals: { type: "integer" },
          date: { type: "string", format: "date-time" },
          phase: { type: "string" },
          homeTeam: { $ref: "#/components/schemas/RoundClub" },
          visitTeam: { $ref: "#/components/schemas/RoundClub" },
        },
        example: {
          id: 1,
          championshipId: 1,
          identifier: "1ª rodada",
          homeGoals: 2,
          visitGoals: 1,
          date: "2026-05-28T20:00:00.000Z",
          phase: "Fase de Grupos",
          homeTeam: {
            id: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
            name: "Sociedade Esportiva Palmeiras",
            country: "Brasil",
            state: "São Paulo",
            shield: "https://ik.imagekit.io/sportnews/clubs/shields/palmeiras.jpg",
            stadium: "Allianz Parque",
          },
          visitTeam: {
            id: "b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6a",
            name: "Sport Club Corinthians Paulista",
            country: "Brasil",
            state: "São Paulo",
            shield: "https://ik.imagekit.io/sportnews/clubs/shields/corinthians.jpg",
            stadium: "Neo Química Arena",
          },
        },
      },
    },
  },
};
