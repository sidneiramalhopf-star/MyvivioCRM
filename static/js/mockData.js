// Dados Mockados para Myvivio CRM
// Dados simulados para validação do frontend antes da integração com backend

const mockData = {
    // Usuário logado atual
    usuarioLogado: {
        id: 1,
        nome: "Usuário Teste",
        email: "usuario@teste.com",
        avatar: "UT",
        inscricoes_ativas: ["aula_1", "aula_5"],
        bloqueado: false
    },

    // Detalhes completos das aulas
    aulasDetalhes: {
        "aula_1": {
            id: "aula_1",
            nome: "GINÁSIO",
            instrutor: "Ramalho Sidnei",
            data: "2025-10-13",
            horario_inicio: "07:00",
            horario_fim: "09:00",
            sala: "GINÁSIO",
            vagas_totais: 30,
            vagas_ocupadas: 21,
            presentes: 21,
            ausentes: 0,
            lista_espera: 0,
            inscritos: [
                { id: 1, nome: "Brito André", avatar: "BA", data_inscricao: "2025-10-10", presente: true },
                { id: 2, nome: "Choi Sung", avatar: "CS", data_inscricao: "2025-10-10", presente: true },
                { id: 3, nome: "Ferrao Jose", avatar: "FJ", data_inscricao: "2025-10-10", presente: true },
                { id: 4, nome: "Ferreira Ricardo", avatar: "FR", data_inscricao: "2025-10-10", presente: true },
                { id: 5, nome: "Silva João", avatar: "SJ", data_inscricao: "2025-10-11", presente: true },
                { id: 6, nome: "Costa Maria", avatar: "CM", data_inscricao: "2025-10-11", presente: true },
                { id: 7, nome: "Santos Pedro", avatar: "SP", data_inscricao: "2025-10-11", presente: true },
                { id: 8, nome: "Oliveira Ana", avatar: "OA", data_inscricao: "2025-10-11", presente: true },
                { id: 9, nome: "Lima Carlos", avatar: "LC", data_inscricao: "2025-10-12", presente: true },
                { id: 10, nome: "Martins Paula", avatar: "MP", data_inscricao: "2025-10-12", presente: true },
                { id: 11, nome: "Rodrigues Bruno", avatar: "RB", data_inscricao: "2025-10-12", presente: true },
                { id: 12, nome: "Fernandes Carla", avatar: "FC", data_inscricao: "2025-10-12", presente: true },
                { id: 13, nome: "Almeida Rita", avatar: "AR", data_inscricao: "2025-10-12", presente: true },
                { id: 14, nome: "Sousa Miguel", avatar: "SM", data_inscricao: "2025-10-12", presente: true },
                { id: 15, nome: "Pereira Laura", avatar: "PL", data_inscricao: "2025-10-12", presente: true },
                { id: 16, nome: "Gomes Tiago", avatar: "GT", data_inscricao: "2025-10-12", presente: true },
                { id: 17, nome: "Ribeiro Sofia", avatar: "RS", data_inscricao: "2025-10-12", presente: true },
                { id: 18, nome: "Castro Diogo", avatar: "CD", data_inscricao: "2025-10-12", presente: true },
                { id: 19, nome: "Moreira Helena", avatar: "MH", data_inscricao: "2025-10-12", presente: true },
                { id: 20, nome: "Correia Vasco", avatar: "CV", data_inscricao: "2025-10-12", presente: true },
                { id: 21, nome: "Monteiro Inês", avatar: "MI", data_inscricao: "2025-10-12", presente: true }
            ]
        },
        "aula_2": {
            id: "aula_2",
            nome: "YOGA",
            instrutor: "Ana Costa",
            data: "2025-10-14",
            horario_inicio: "07:00",
            horario_fim: "08:00",
            sala: "Sala 1",
            vagas_totais: 20,
            vagas_ocupadas: 15,
            presentes: 14,
            ausentes: 1,
            lista_espera: 2,
            inscritos: [
                { id: 22, nome: "Costa Sandra", avatar: "CS", data_inscricao: "2025-10-11", presente: true },
                { id: 23, nome: "Silva Teresa", avatar: "ST", data_inscricao: "2025-10-11", presente: true },
                { id: 24, nome: "Lopes André", avatar: "LA", data_inscricao: "2025-10-11", presente: false },
                { id: 25, nome: "Neves Catarina", avatar: "NC", data_inscricao: "2025-10-12", presente: true },
                { id: 26, nome: "Pinto Rui", avatar: "PR", data_inscricao: "2025-10-12", presente: true },
                { id: 27, nome: "Cunha Beatriz", avatar: "CB", data_inscricao: "2025-10-12", presente: true },
                { id: 28, nome: "Teixeira Marco", avatar: "TM", data_inscricao: "2025-10-12", presente: true },
                { id: 29, nome: "Barros Isabel", avatar: "BI", data_inscricao: "2025-10-13", presente: true },
                { id: 30, nome: "Cardoso Hugo", avatar: "CH", data_inscricao: "2025-10-13", presente: true },
                { id: 31, nome: "Azevedo Liliana", avatar: "AL", data_inscricao: "2025-10-13", presente: true },
                { id: 32, nome: "Mendes Filipe", avatar: "MF", data_inscricao: "2025-10-13", presente: true },
                { id: 33, nome: "Coelho Marta", avatar: "CM", data_inscricao: "2025-10-13", presente: true },
                { id: 34, nome: "Dias Rafael", avatar: "DR", data_inscricao: "2025-10-13", presente: true },
                { id: 35, nome: "Campos Joana", avatar: "CJ", data_inscricao: "2025-10-13", presente: true },
                { id: 36, nome: "Xavier Gonçalo", avatar: "XG", data_inscricao: "2025-10-13", presente: true }
            ]
        },
        "aula_3": {
            id: "aula_3",
            nome: "PILATES",
            instrutor: "Patrício Susana",
            data: "2025-10-15",
            horario_inicio: "18:00",
            horario_fim: "19:00",
            sala: "Sala 2",
            vagas_totais: 15,
            vagas_ocupadas: 12,
            presentes: 10,
            ausentes: 2,
            lista_espera: 0,
            inscritos: [
                { id: 37, nome: "Antunes Vera", avatar: "AV", data_inscricao: "2025-10-12", presente: true },
                { id: 38, nome: "Baptista Nuno", avatar: "BN", data_inscricao: "2025-10-12", presente: false },
                { id: 39, nome: "Carvalho Sónia", avatar: "CS", data_inscricao: "2025-10-12", presente: true },
                { id: 40, nome: "Duarte Paulo", avatar: "DP", data_inscricao: "2025-10-13", presente: true },
                { id: 41, nome: "Esteves Clara", avatar: "EC", data_inscricao: "2025-10-13", presente: true },
                { id: 42, nome: "Fonseca Luís", avatar: "FL", data_inscricao: "2025-10-13", presente: false },
                { id: 43, nome: "Garcia Patrícia", avatar: "GP", data_inscricao: "2025-10-13", presente: true },
                { id: 44, nome: "Henriques Sérgio", avatar: "HS", data_inscricao: "2025-10-14", presente: true },
                { id: 45, nome: "Inácio Raquel", avatar: "IR", data_inscricao: "2025-10-14", presente: true },
                { id: 46, nome: "Jorge Válter", avatar: "JV", data_inscricao: "2025-10-14", presente: true },
                { id: 47, nome: "Leal Andreia", avatar: "LA", data_inscricao: "2025-10-14", presente: true },
                { id: 48, nome: "Matos Ricardo", avatar: "MR", data_inscricao: "2025-10-14", presente: true }
            ]
        }
    },

    // Aulas disponíveis para agendamento
    aulasDisponiveis: [
        {
            id: "aula_2",
            nome: "YOGA",
            tipo: "YOGA",
            data: "2025-10-14",
            horario_inicio: "07:00",
            horario_fim: "08:00",
            vagas_disponiveis: 5,
            instrutor: "Ana Costa",
            sala: "Sala 1"
        },
        {
            id: "aula_3",
            nome: "PILATES",
            tipo: "PILATES",
            data: "2025-10-15",
            horario_inicio: "18:00",
            horario_fim: "19:00",
            vagas_disponiveis: 3,
            instrutor: "Patrício Susana",
            sala: "Sala 2"
        },
        {
            id: "aula_4",
            nome: "CROSSFIT",
            tipo: "CROSSFIT",
            data: "2025-10-16",
            horario_inicio: "19:00",
            horario_fim: "20:00",
            vagas_disponiveis: 10,
            instrutor: "João Silva",
            sala: "Área Externa"
        },
        {
            id: "aula_5",
            nome: "NATAÇÃO",
            tipo: "NATAÇÃO",
            data: "2025-10-17",
            horario_inicio: "06:00",
            horario_fim: "07:00",
            vagas_disponiveis: 8,
            instrutor: "Carlos Mendes",
            sala: "Piscina"
        }
    ],

    // Todas as aulas para filtros
    todasAulas: [
        {
            id: "aula_1",
            tipo: "GINÁSIO",
            sala: "GINÁSIO",
            instrutor: "Ramalho Sidnei",
            data: "2025-10-13",
            horario_inicio: "07:00",
            horario_fim: "09:00"
        },
        {
            id: "aula_2",
            tipo: "YOGA",
            sala: "Sala 1",
            instrutor: "Ana Costa",
            data: "2025-10-14",
            horario_inicio: "07:00",
            horario_fim: "08:00"
        },
        {
            id: "aula_3",
            tipo: "PILATES",
            sala: "Sala 2",
            instrutor: "Patrício Susana",
            data: "2025-10-15",
            horario_inicio: "18:00",
            horario_fim: "19:00"
        },
        {
            id: "aula_4",
            tipo: "CROSSFIT",
            sala: "Área Externa",
            instrutor: "João Silva",
            data: "2025-10-16",
            horario_inicio: "19:00",
            horario_fim: "20:00"
        },
        {
            id: "aula_5",
            tipo: "NATAÇÃO",
            sala: "Piscina",
            instrutor: "Carlos Mendes",
            data: "2025-10-17",
            horario_inicio: "06:00",
            horario_fim: "07:00"
        },
        {
            id: "aula_6",
            tipo: "YOGA",
            sala: "Sala 1",
            instrutor: "Ana Costa",
            data: "2025-10-18",
            horario_inicio: "19:00",
            horario_fim: "20:00"
        },
        {
            id: "aula_7",
            tipo: "GINÁSIO",
            sala: "GINÁSIO",
            instrutor: "Ramalho Sidnei",
            data: "2025-10-19",
            horario_inicio: "07:00",
            horario_fim: "09:00"
        },
        {
            id: "aula_8",
            tipo: "PILATES",
            sala: "Sala 2",
            instrutor: "Patrício Susana",
            data: "2025-10-20",
            horario_inicio: "09:00",
            horario_fim: "10:00"
        }
    ],

    // Penalidades
    penalidades: [
        {
            id: 1,
            usuario: {
                nome: "Filipa Mendes",
                avatar: "BF",
                id: 101
            },
            faltas: [
                {
                    aula: "PILATES",
                    instrutor: "Patrício Susana",
                    data: "2025-10-07",
                    horario: "13:00 - 13:45",
                    sala: "STUDIO"
                }
            ],
            total_faltas: 1,
            bloqueado: false,
            dias_restantes_bloqueio: 0,
            data_primeira_falta: "2025-10-07"
        },
        {
            id: 2,
            usuario: {
                nome: "Brito Maria",
                avatar: "BY",
                id: 102
            },
            faltas: [
                {
                    aula: "YOGA",
                    instrutor: "Ana Costa",
                    data: "2025-10-08",
                    horario: "07:00 - 08:00",
                    sala: "Sala 1"
                },
                {
                    aula: "GINÁSIO",
                    instrutor: "Ramalho Sidnei",
                    data: "2025-10-11",
                    horario: "19:00 - 20:00",
                    sala: "GINÁSIO"
                }
            ],
            total_faltas: 2,
            bloqueado: true,
            dias_restantes_bloqueio: 5,
            data_primeira_falta: "2025-10-08"
        },
        {
            id: 3,
            usuario: {
                nome: "Caeiro Maria Helena",
                avatar: "BA",
                id: 103
            },
            faltas: [
                {
                    aula: "CROSSFIT",
                    instrutor: "João Silva",
                    data: "2025-10-09",
                    horario: "19:00 - 20:00",
                    sala: "Área Externa"
                },
                {
                    aula: "NATAÇÃO",
                    instrutor: "Carlos Mendes",
                    data: "2025-10-12",
                    horario: "06:00 - 07:00",
                    sala: "Piscina"
                }
            ],
            total_faltas: 2,
            bloqueado: true,
            dias_restantes_bloqueio: 3,
            data_primeira_falta: "2025-10-09"
        }
    ],

    // Opções para filtros
    filtrosOpcoes: {
        aulas: ["Todas", "YOGA", "PILATES", "GINÁSIO", "NATAÇÃO", "CROSSFIT"],
        salas: ["Todas", "Sala 1", "Sala 2", "GINÁSIO", "Piscina", "Área Externa", "STUDIO"],
        instrutores: ["Todos", "João Silva", "Ana Costa", "Ramalho Sidnei", "Patrício Susana", "Carlos Mendes"]
    }
};

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.mockData = mockData;
}
