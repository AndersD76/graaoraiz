import { acumulado, chuvaPorMes, maiorSequenciaSeca, type RegistroChuva } from './chuva';
import { formatarData, formatarMes, formatarMm, formatarNumero } from './formatos';
import { ATRIBUICAO_OPEN_METEO } from './open-meteo';
import type { Safra } from './safra';

export interface EventoSafra {
  data: string;
  tipo: 'granizo' | 'seca' | 'geada' | 'excessoChuva' | 'outro';
  nota?: string;
}

export interface DadosRelatorio {
  talhao: { nome: string; lat: number; lon: number; cultura?: string; dataPlantio?: string };
  safra: Safra;
  /** Último dia coberto (normalmente hoje). */
  ate: string;
  /** "2026-10-22T14:35". */
  geradoEm: string;
  /** Chuva já mesclada (anotada + estimada). */
  chuva: RegistroChuva[];
  /** Média histórica acumulada no mesmo período, quando disponível. */
  normal: number | null;
  eventos: EventoSafra[];
}

const NOMES_EVENTO: Record<EventoSafra['tipo'], string> = {
  granizo: 'Granizo',
  seca: 'Seca',
  geada: 'Geada',
  excessoChuva: 'Excesso de chuva',
  outro: 'Outro',
};

function escapar(texto: string): string {
  return texto
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** HTML autocontido do relatório da safra, pronto para virar PDF no aparelho. */
export function montarRelatorioHtml(d: DadosRelatorio): string {
  const periodo = d.chuva.filter((r) => r.data >= d.safra.inicio && r.data <= d.ate);
  const total = acumulado(periodo, d.safra.inicio, d.ate);
  const anotados = periodo.filter((r) => r.origem === 'manual').length;
  const diasComChuva = periodo.filter((r) => r.mm >= 1).length;
  const seca = maiorSequenciaSeca(periodo);
  const meses = chuvaPorMes(periodo);
  // Multiplica antes de dividir para evitar 57,4999… em vez de 57,5.
  const diferenca = d.normal && d.normal > 0 ? ((total - d.normal) * 100) / d.normal : null;

  const linhaResumo = (rotulo: string, valor: string) =>
    `<tr><th>${escapar(rotulo)}</th><td>${escapar(valor)}</td></tr>`;

  const resumo = [
    linhaResumo('Chuva acumulada', formatarMm(total)),
    d.normal !== null ? linhaResumo('Média histórica no mesmo período', formatarMm(d.normal)) : '',
    diferenca !== null ? linhaResumo('Diferença para a média', `${diferenca >= 0 ? '+' : ''}${formatarNumero(diferenca, 0)}%`) : '',
    linhaResumo('Dias com chuva (≥ 1 mm)', String(diasComChuva)),
    seca
      ? linhaResumo(
          'Maior sequência sem chuva (< 2 mm)',
          `${seca.dias} ${seca.dias === 1 ? 'dia' : 'dias'} (${formatarData(seca.inicio)} a ${formatarData(seca.fim)})`,
        )
      : '',
    linhaResumo('Dias anotados pelo produtor', `${anotados} de ${periodo.length}`),
  ].join('');

  const tabelaMeses = meses
    .map((m) => `<tr><td>${escapar(formatarMes(m.mes))}</td><td>${escapar(formatarMm(m.mm))}</td><td>${m.diasAnotados}</td><td>${m.diasEstimados}</td></tr>`)
    .join('');

  const eventos = d.eventos.length
    ? `<table><thead><tr><th>Data</th><th>Evento</th><th>Observação</th></tr></thead><tbody>${d.eventos
        .map((e) => `<tr><td>${formatarData(e.data)}/${e.data.slice(0, 4)}</td><td>${NOMES_EVENTO[e.tipo]}</td><td>${escapar(e.nota ?? '')}</td></tr>`)
        .join('')}</tbody></table>`
    : '<p>Nenhum evento registrado.</p>';

  const diario = periodo
    .map((r) => `<tr><td>${formatarData(r.data)}/${r.data.slice(0, 4)}</td><td>${escapar(formatarMm(r.mm))}</td><td>${r.origem === 'manual' ? 'Anotada' : 'Estimada'}</td></tr>`)
    .join('');

  const cultura = [d.talhao.cultura, d.talhao.dataPlantio ? `plantio em ${formatarData(d.talhao.dataPlantio)}/${d.talhao.dataPlantio.slice(0, 4)}` : '']
    .filter(Boolean)
    .join(', ');

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório da safra ${escapar(d.safra.rotulo)} — ${escapar(d.talhao.nome)}</title>
<style>
body{font-family:-apple-system,Roboto,Helvetica,Arial,sans-serif;color:#0B0F0C;margin:32px;font-size:12px}
h1{font-size:20px;color:#1F6B2E;margin:0 0 4px}h2{font-size:14px;margin:24px 0 8px;color:#1F6B2E}
p{margin:4px 0}table{border-collapse:collapse;width:100%;margin-top:4px}
th,td{border:1px solid #DDE3DB;padding:4px 6px;text-align:left}thead th{background:#F0F2EF}
.resumo th{width:55%;background:#F0F2EF;font-weight:600}.nota{color:#4A524B;font-size:10px;margin-top:24px}
</style></head><body>
<h1>Relatório da safra ${escapar(d.safra.rotulo)}</h1>
<p><strong>${escapar(d.talhao.nome)}</strong>${cultura ? ` — ${escapar(cultura)}` : ''}</p>
<p>Local: ${d.talhao.lat.toFixed(4)}, ${d.talhao.lon.toFixed(4)} · Período: ${formatarData(d.safra.inicio)}/${d.safra.inicio.slice(0, 4)} a ${formatarData(d.ate)}/${d.ate.slice(0, 4)}</p>
<p>Gerado em ${formatarData(d.geradoEm.slice(0, 10))}/${d.geradoEm.slice(0, 4)} às ${escapar(d.geradoEm.slice(11, 16))} pelo app Grão Raiz.</p>
<h2>Resumo</h2><table class="resumo"><tbody>${resumo}</tbody></table>
<h2>Chuva por mês</h2><table><thead><tr><th>Mês</th><th>Chuva</th><th>Dias anotados</th><th>Dias estimados</th></tr></thead><tbody>${tabelaMeses}</tbody></table>
<h2>Eventos registrados</h2>${eventos}
<h2>Chuva diária</h2><table><thead><tr><th>Data</th><th>Chuva</th><th>Origem</th></tr></thead><tbody>${diario}</tbody></table>
<p class="nota">Documento de apoio gerado a partir das anotações do produtor e de estimativas de modelos meteorológicos (dias marcados como "Estimada"). Não substitui laudo de profissional habilitado. ${escapar(ATRIBUICAO_OPEN_METEO)}.</p>
</body></html>`;
}
