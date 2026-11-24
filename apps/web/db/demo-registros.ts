// Monta chuvas, aplicações e uma ocorrência de exemplo para a conta de demonstração, com o tempo real
// (Open-Meteo, últimos 92 dias) de cada talhão e as próprias regras do app (hora boa para pulverizar).
// Grava em db/demo-estado.json; depois, `node --env-file=.env.local db/demo.mjs` leva para o banco.
// Uso (em apps/web): ../../node_modules/.bin/jiti db/demo-registros.ts
// As datas são da safra 2026/27: para outra safra, ajuste o plantio e os períodos de PLANOS.
import { readFileSync, writeFileSync } from 'node:fs';

import { condicoesNaHora, lerHoras, PRODUTOS, urlPrevisao, type Aplicacao, type TipoProduto } from '@graoraiz/clima';

const ARQUIVO = 'db/demo-estado.json';
const estado = JSON.parse(readFileSync(ARQUIVO, 'utf8'));

interface Plano {
  talhao: string;
  tipo: TipoProduto;
  produto: string;
  de: string;
  ate: string;
  observacao?: string;
}

// Momentos típicos de cada lavoura (trigo plantado em 15/06, colheita estimada pelo app em 13/10: fungicidas na
// floração, cerca de um mês antes; soja em 19/10, na estiagem de 16 a 22/10).
// Sem marca nem dose: é exemplo. A dessecação vem primeiro porque disputa os mesmos dias com o trigo.
const PLANOS: Plano[] = [
  { talhao: 'demo-soja', tipo: 'herbicida', produto: 'Dessecação antes do plantio', de: '2026-10-01', ate: '2026-10-11' },
  { talhao: 'demo-trigo', tipo: 'fungicida', produto: 'Fungicida na floração (giberela)', de: '2026-09-01', ate: '2026-09-08' },
  { talhao: 'demo-trigo', tipo: 'fungicida', produto: 'Fungicida, segunda aplicação (giberela)', de: '2026-09-11', ate: '2026-09-18' },
  { talhao: 'demo-soja', tipo: 'inseticida', produto: 'Inseticida para lagarta', de: '2026-11-17', ate: '2026-11-21', observacao: 'Controle das lagartas vistas no monitoramento de 16/11.' },
];

async function principal() {
const soja = estado.talhoes.find((t: { id: string }) => t.id === 'demo-soja');
soja.dataPlantio = '2026-10-19';
const talhoes: { id: string; lat: number; lon: number; areaHa: number }[] = estado.talhoes;
const horasPorTalhao = new Map<string, ReturnType<typeof lerHoras>>();
for (const t of talhoes) {
  const r = await fetch(urlPrevisao(t.lat, t.lon, { diasPassados: 92, diasPrevisao: 1 }));
  if (!r.ok) throw new Error(`Open-Meteo ${r.status}`);
  horasPorTalhao.set(t.id, lerHoras(await r.json()));
}

// Chuva anotada no pluviômetro (um só, na soja; o trigo fica a 800 m): dias com 5 mm ou mais, arredondados.
const chuvas: { talhaoId: string; data: string; mm: number }[] = [];
for (const t of talhoes.filter((x) => x.id === 'demo-soja')) {
  const porDia = new Map<string, number>();
  for (const h of horasPorTalhao.get(t.id)!) porDia.set(h.hora.slice(0, 10), (porDia.get(h.hora.slice(0, 10)) ?? 0) + h.chuva);
  for (const [data, mm] of porDia) if (data >= '2026-09-25' && data < '2026-11-24' && mm >= 5) chuvas.push({ talhaoId: t.id, data, mm: Math.round(mm) });
}

// Aplicação: a primeira hora do dia (7h–17h) boa para pulverizar dentro do período do plano.
const aplicacoes: Aplicacao[] = [];
const diasUsados = new Set<string>(); // um pulverizador só: uma aplicação por dia
for (const [n, p] of PLANOS.entries()) {
  const horas = horasPorTalhao.get(p.talhao)!;
  const talhao = talhoes.find((t) => t.id === p.talhao)!;
  let escolhida: { quando: string; condicoes: NonNullable<ReturnType<typeof condicoesNaHora>> } | null = null;
  for (const h of horas) {
    const data = h.hora.slice(0, 10);
    const hora = Number(h.hora.slice(11, 13));
    if (data < p.de || data > p.ate || hora < 7 || hora > 17 || diasUsados.has(data)) continue;
    const condicoes = condicoesNaHora(horas, h.hora, estado.limiares);
    // Hora boa para pulverizar e temperatura de trabalho (sem madrugada gelada nem calor forte).
    if (condicoes?.status === 'bom' && condicoes.temperatura >= 12 && condicoes.temperatura <= 28) {
      escolhida = { quando: `${h.hora.slice(0, 11)}${String(hora).padStart(2, '0')}:30`, condicoes };
      break;
    }
  }
  if (!escolhida) {
    console.log('sem hora boa para', p.produto);
    continue;
  }
  diasUsados.add(escolhida.quando.slice(0, 10));
  aplicacoes.push({
    id: `demo-aplicacao-${n + 1}`,
    talhaoId: p.talhao,
    quando: escolhida.quando,
    tipo: p.tipo,
    produto: p.produto,
    areaHa: talhao.areaHa,
    horasSemChuva: PRODUTOS[p.tipo].horasSemChuva,
    residualDias: PRODUTOS[p.tipo].residualDias,
    condicoes: escolhida.condicoes,
    ...(p.observacao ? { observacao: p.observacao } : {}),
  });
}

// Ocorrência: lagarta no monitoramento, dois dias antes da aplicação de inseticida.
const eventos = [
  {
    id: 'demo-ocorrencia-1',
    talhaoId: 'demo-soja',
    data: '2026-11-16',
    tipo: 'praga',
    nota: 'Monitoramento com pano de batida: lagartas acima do nível de controle. Aplicar na próxima hora boa.',
    fotos: [],
    registradaEm: '2026-11-16T16:40',
  },
];

estado.chuvas = chuvas.sort((a, b) => a.data.localeCompare(b.data));
estado.aplicacoes = aplicacoes.sort((a, b) => a.quando.localeCompare(b.quando));
estado.eventos = eventos;
writeFileSync(ARQUIVO, `${JSON.stringify(estado, null, 2)}\n`);
console.log(`chuvas ${chuvas.length}, aplicações ${aplicacoes.length}, ocorrências ${eventos.length}`);
for (const a of estado.aplicacoes) console.log(a.quando, a.talhaoId, a.produto, JSON.stringify(a.condicoes));
console.log(JSON.stringify(eventos));
}

principal().catch((e) => {
  console.error('falha:', e);
  process.exit(1);
});
