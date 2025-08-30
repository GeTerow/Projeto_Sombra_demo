import { Saleswoman, Task, TaskStatus, User, UserRole } from '@prisma/client';

// -- DADOS MOCKADOS PARA A VERSÃO DE DEMONSTRAÇÃO --

export const mockSaleswomen: Saleswoman[] = [
  {
    id: 'clw8s7o4g0000v9z6jh7h4a0f',
    name: 'Ana Beatriz',
    email: 'ana.beatriz@example.com',
    summaryPdfPath: '/path/to/fake-summary.pdf',
    summaryLastGeneratedAt: new Date('2025-08-28T10:00:00.000Z'),
    summaryGenerationsToday: 1,
    summaryLastGenerationDate: new Date('2025-08-28T00:00:00.000Z'),
  },
  {
    id: 'clw8s7o4h0001v9z6k2j3g4h5',
    name: 'Carla Dias',
    email: 'carla.dias@example.com',
    summaryPdfPath: null,
    summaryLastGeneratedAt: null,
    summaryGenerationsToday: 0,
    summaryLastGenerationDate: null,
  },
];

const saleswomanAna = mockSaleswomen[0];
const saleswomanCarla = mockSaleswomen[1];

export const mockTasks: (Task & { saleswoman: Saleswoman })[] = [
  {
    id: 'task001_anabeatriz',
    clientName: 'Cliente TechCorp',
    saleswomanId: saleswomanAna.id,
    saleswoman: saleswomanAna,
    status: TaskStatus.COMPLETED,
    audioFilePath: 'mock/path/audio1.mp3',
    transcription: `WEBVTT

00:00:01.500 --> 00:00:04.000
[SPEAKER_00]: Olá, aqui é a Ana da Sombra Corp. Falo com o Sr. Marcos?

00:00:04.500 --> 00:00:06.000
[SPEAKER_01]: Olá, Ana. Sim, sou eu.

00:00:06.500 --> 00:00:10.000
[SPEAKER_00]: Ótimo! Vi que você se interessou pela nossa solução de análise de dados.

00:00:10.500 --> 00:00:14.000
[SPEAKER_01]: Sim, estou pesquisando algumas opções no mercado. O que vocês oferecem?
`,
    analysis: {
      summary: "A chamada foi uma introdução positiva para qualificação do lead. A vendedora estabeleceu o motivo do contato e confirmou o interesse inicial do cliente. O principal resultado foi o agendamento de uma demonstração técnica para a próxima semana.",
      speakerMapping: {
        "SPEAKER_00": "Ana Beatriz (Vendedora)",
        "SPEAKER_01": "Sr. Marcos (Cliente)"
      },
      customerProfile: {
        name: "Sr. Marcos",
        profile: "Decisor técnico, provavelmente um gerente de TI ou CTO.",
        communicationStyle: "Direto e objetivo, focado em entender a solução rapidamente."
      },
      performance: {
        overallScore: 82,
        stages: {
          opening: {
            score: 95,
            feedback: "Abertura excelente. Foi direta, apresentou a si mesma e a empresa, e foi direto ao ponto, respeitando o tempo do cliente.",
            improvementSuggestion: "Manter essa abordagem objetiva para clientes com perfil similar."
          },
          discovery: {
            score: 75,
            feedback: "Fez perguntas iniciais boas, mas poderia ter aprofundado mais nas dores específicas antes de apresentar a solução.",
            improvementSuggestion: "Após o cliente perguntar 'O que vocês oferecem?', devolver com uma pergunta para entender melhor a necessidade, como 'Para eu ser mais direto, qual o principal desafio que vocês enfrentam com análise de dados hoje?'."
          },
          qualification: {
            score: 88,
            feedback: "Qualificou bem o interesse e identificou que o Sr. Marcos é o decisor técnico. Conseguiu extrair a urgência do projeto.",
            improvementSuggestion: "Tentar identificar se há um orçamento pré-aprovado para a solução."
          },
          closing: {
            score: 70,
            feedback: "O fechamento foi positivo com o agendamento da demo, mas faltou uma recapitulação dos pontos discutidos e a confirmação dos próximos passos de forma mais estruturada.",
            improvementSuggestion: "Finalizar com um resumo, como: 'Ótimo, Sr. Marcos. Então, agendamos nossa demo para terça às 14h, onde vamos focar em X e Y, que são suas prioridades. Após a chamada, enviarei um convite na agenda com esses detalhes. Correto?'."
          }
        }
      },
      improvementPoints: [
        {
          salespersonLine: "Vi que você se interessou pela nossa solução de análise de dados.",
          context: "Esta foi a segunda frase da vendedora, logo após se apresentar. O cliente tinha acabado de confirmar sua identidade. A vendedora partiu de uma informação de um lead (provavelmente preenchimento de formulário) para iniciar a conversa.",
          whatWentWrong: "A frase é um pouco genérica e passiva. Ela coloca a vendedora em uma posição de quem está 'seguindo uma pista', em vez de uma especialista que pode resolver um problema.",
          impact: "O impacto foi mínimo nesta chamada porque o cliente estava receptivo. No entanto, com um cliente mais cético, essa abordagem poderia soar como 'mais um vendedor de telemarketing', diminuindo a autoridade da vendedora.",
          suggestion: "Uma abordagem mais proativa e que agrega valor desde o início seria mais forte. Exemplo: 'Sr. Marcos, vi que você está buscando soluções de análise de dados. Muitas empresas de tecnologia como a sua nos procuram para resolver o desafio de centralizar e visualizar grandes volumes de informação. Esse também é o seu caso?' Isso demonstra conhecimento do setor e já inicia a fase de descoberta."
        }
      ]
    },
    createdAt: new Date('2025-08-27T14:30:00.000Z'),
    updatedAt: new Date('2025-08-27T14:35:00.000Z'),
    includedInSummary: false,
  },
  {
    id: 'task002_carladias',
    clientName: 'Inova Soluções',
    saleswomanId: saleswomanCarla.id,
    saleswoman: saleswomanCarla,
    status: TaskStatus.TRANSCRIBED,
    audioFilePath: 'mock/path/audio2.mp3',
    transcription: `WEBVTT

00:00:01.000 --> 00:00:02.000
[SPEAKER_01]: Alô?

00:00:02.500 --> 00:00:04.000
[SPEAKER_00]: Oi, é a Carla, tudo bem?
`,
    analysis: null,
    createdAt: new Date('2025-08-26T11:00:00.000Z'),
    updatedAt: new Date('2025-08-26T11:02:00.000Z'),
    includedInSummary: false,
  },
];

export const mockUsers: Omit<User, 'password'>[] = [
    { id: 'user-admin-01', email: 'admin@exemplo.com', name: 'Admin (Demo)', role: UserRole.ADMIN, createdAt: new Date(), updatedAt: new Date() },
    { id: 'user-regular-01', email: 'user@exemplo.com', name: 'Usuário (Demo)', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() }
];