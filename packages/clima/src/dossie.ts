import { type Aplicacao, PRODUTOS } from './aplicacoes';
import { acumulado, maiorSequenciaSeca, type RegistroChuva } from './chuva';
import { CULTURAS, type Cultura } from './culturas';
import { type EventoDetectado, prazoComunicacao } from './eventos';
import { formatarData, formatarMm, formatarNumero } from './formatos';
import { ATRIBUICAO_OPEN_METEO } from './open-meteo';
import { type JanelaZarc, SOLOS, type Solo } from './plantio';
import type { Safra } from './safra';

/**
 * Dossiê do talhão: reúne num PDF o que o produtor precisa para comunicar uma perda ao banco ou
 * à seguradora e para o caderno de campo — identificação, janela do ZARC, eventos adversos com
 * prazo, ocorrências com fotos, aplicações com as condições do tempo e o diário climático.
 */

export interface OcorrenciaDossie {
  data: string;
  tipo: string;
  nota?: string;
  /** Imagens já prontas para o HTML (data URI ou arquivo local). */
  fotos?: string[];
  /** Quando o produtor marcou que comunicou o banco/seguradora. */
  comunicadoEm?: string;
}

export interface DiaDiario {
  data: string;
  tMin?: number;
  tMax?: number;
  rajada?: number;
}

export interface DadosDossie {
  talhao: {
    nome: string;
    lat: number;
    lon: number;
    cultura: Cultura | null;
    dataPlantio: string | null;
    areaHa: number | null;
    solo: Solo;
    zarc: JanelaZarc | null;
  };
  seguro: { tipo: string; agente?: string; prazoDias: number | null } | null;
  produtor?: string;
  safra: Safra;
  ate: string;
  geradoEm: string;
  chuva: RegistroChuva[];
  temperaturas: DiaDiario[];
  normal: number | null;
  eventos: EventoDetectado[];
  ocorrencias: OcorrenciaDossie[];
  aplicacoes: (Aplicacao & { lavagem?: string })[];
}

function escapar(texto: string): string {
  return texto.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function dataCompleta(data: string): string {
  return `${formatarData(data)}/${data.slice(0, 4)}`;
}

function temp(n: number | undefined): string {
  return n === undefined ? '—' : `${formatarNumero(n, 1)} °C`;
}

function fotoSegura(src: string): string | null {
  // Só imagens embutidas ou arquivos do aparelho; nada de endereço externo no documento.
  return /^(data:image\/(png|jpe?g|webp);base64,|file:\/\/)/.test(src) ? src : null;
}

export function montarDossieHtml(d: DadosDossie): string {
  const periodo = d.chuva.filter((r) => r.data >= d.safra.inicio && r.data <= d.ate);
  const total = acumulado(periodo, d.safra.inicio, d.ate);
  const seca = maiorSequenciaSeca(periodo);
  const anotados = periodo.filter((r) => r.origem === 'manual').length;
  const temps = d.temperaturas.filter((t) => t.data >= d.safra.inicio && t.data <= d.ate);
  const minimas = temps.map((t) => t.tMin).filter((v): v is number => v !== undefined);
  const maximas = temps.map((t) => t.tMax).filter((v): v is number => v !== undefined);
  const diferenca = d.normal && d.normal > 0 ? ((total - d.normal) * 100) / d.normal : null;
  const cultura = d.talhao.cultura ? CULTURAS[d.talhao.cultura].rotulo : 'Não informada';

  const linha = (rotulo: string, valor: string) => `<tr><th>${escapar(rotulo)}</th><td>${escapar(valor)}</td></tr>`;

  let zarcTexto = 'Não informada';
  if (d.talhao.zarc) {
    const { inicio, fim } = d.talhao.zarc;
    zarcTexto = `${dataCompleta(inicio)} a ${dataCompleta(fim)}`;
    if (d.talhao.dataPlantio) {
      const dentro = d.talhao.dataPlantio >= inicio && d.talhao.dataPlantio <= fim;
      zarcTexto += dentro ? ' — plantio dentro da janela' : ' — ATENÇÃO: plantio fora da janela';
    }
  }

  const identificacao = [
    linha('Talhão', d.talhao.nome),
    d.produtor ? linha('Produtor', d.produtor) : '',
    linha('Cultura', cultura),
    linha('Área', d.talhao.areaHa ? `${formatarNumero(d.talhao.areaHa, 1)} ha` : 'Não informada'),
    linha('Solo', SOLOS[d.talhao.solo].rotulo),
    linha('Coordenadas', `${d.talhao.lat.toFixed(5)}, ${d.talhao.lon.toFixed(5)}`),
    linha('Plantio', d.talhao.dataPlantio ? dataCompleta(d.talhao.dataPlantio) : 'Não informado'),
    linha('Janela do ZARC', zarcTexto),
    d.seguro ? linha('Cobertura', `${d.seguro.tipo}${d.seguro.agente ? ` — ${d.seguro.agente}` : ''}`) : '',
  ].join('');

  const resumo = [
    linha('Chuva acumulada na safra', formatarMm(total)),
    d.normal !== null ? linha('Média histórica no período (1991–2020)', formatarMm(d.normal)) : '',
    diferenca !== null ? linha('Diferença para a média', `${diferenca >= 0 ? '+' : ''}${formatarNumero(diferenca, 0)}%`) : '',
    linha('Dias com chuva (≥ 1 mm)', String(periodo.filter((r) => r.mm >= 1).length)),
    seca ? linha('Maior sequência sem chuva (< 2 mm)', `${seca.dias} dias (${formatarData(seca.inicio)} a ${formatarData(seca.fim)})`) : '',
    minimas.length ? linha('Menor temperatura', temp(Math.min(...minimas))) : '',
    maximas.length ? linha('Maior temperatura', temp(Math.max(...maximas))) : '',
    linha('Dias de chuva medidos pelo produtor', `${anotados} de ${periodo.length}`),
  ].join('');

  const eventos = d.eventos.length
    ? `<table><thead><tr><th>Período</th><th>Evento</th><th>Detalhe</th><th>Comunicar até</th></tr></thead><tbody>${d.eventos
        .map((e) => {
          const prazo = d.seguro ? prazoComunicacao(e, d.seguro.prazoDias, d.ate) : null;
          const periodoTxt = e.inicio === e.fim ? dataCompleta(e.inicio) : `${formatarData(e.inicio)} a ${dataCompleta(e.fim)}`;
          return `<tr${e.gravidade === 'severo' ? ' class="severo"' : ''}><td>${periodoTxt}</td><td>${escapar(e.titulo)}</td><td>${escapar(e.detalhe)}</td><td>${prazo ? dataCompleta(prazo.ate) : 'Conferir no contrato'}</td></tr>`;
        })
        .join('')}</tbody></table>`
    : '<p>Nenhum evento adverso detectado no período.</p>';

  const ocorrencias = d.ocorrencias.length
    ? d.ocorrencias
        .map((o) => {
          const fotos = (o.fotos ?? []).map(fotoSegura).filter((f): f is string => f !== null);
          return `<div class="ocorrencia"><p><strong>${dataCompleta(o.data)} — ${escapar(o.tipo)}</strong>${o.comunicadoEm ? ` · comunicado em ${dataCompleta(o.comunicadoEm)}` : ''}</p>${o.nota ? `<p>${escapar(o.nota)}</p>` : ''}${
            fotos.length ? `<div class="fotos">${fotos.map((f) => `<img src="${f}" alt="Foto da ocorrência">`).join('')}</div>` : ''
          }</div>`;
        })
        .join('')
    : '<p>Nenhuma ocorrência registrada pelo produtor.</p>';

  const aplicacoes = d.aplicacoes.length
    ? `<table><thead><tr><th>Data e hora</th><th>Produto</th><th>Dose</th><th>Condições na hora</th><th>Chuva depois</th></tr></thead><tbody>${[...d.aplicacoes]
        .sort((a, b) => a.quando.localeCompare(b.quando))
        .map((a) => {
          const c = a.condicoes;
          const cond = c
            ? `${formatarNumero(c.temperatura, 0)} °C, UR ${formatarNumero(c.umidade, 0)}%, vento ${formatarNumero(c.vento2m, 0)} km/h, ΔT ${formatarNumero(c.deltaT, 1)}${c.motivos.length ? ` (${c.motivos.join('; ')})` : ''}`
            : 'Sem dado';
          return `<tr><td>${dataCompleta(a.quando.slice(0, 10))} ${a.quando.slice(11, 16)}</td><td>${escapar(a.produto || PRODUTOS[a.tipo].rotulo)} <span class="tipo">${escapar(PRODUTOS[a.tipo].rotulo)}</span></td><td>${escapar(a.dose ?? '—')}</td><td>${escapar(cond)}</td><td>${escapar(a.lavagem ?? '—')}</td></tr>`;
        })
        .join('')}</tbody></table>`
    : '<p>Nenhuma aplicação registrada.</p>';

  const porDataTemp = new Map(temps.map((t) => [t.data, t]));
  const diario = periodo
    .map((r) => {
      const t = porDataTemp.get(r.data);
      return `<tr><td>${dataCompleta(r.data)}</td><td>${escapar(formatarMm(r.mm))}</td><td>${r.origem === 'manual' ? 'Pluviômetro' : 'Estimada'}</td><td>${temp(t?.tMin)}</td><td>${temp(t?.tMax)}</td><td>${t?.rajada !== undefined ? `${Math.round(t.rajada)} km/h` : '—'}</td></tr>`;
    })
    .join('');

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Dossiê do talhão ${escapar(d.talhao.nome)} — safra ${escapar(d.safra.rotulo)}</title>
<style>
body{font-family:-apple-system,Roboto,Helvetica,Arial,sans-serif;color:#0F1A12;margin:28px;font-size:11px}
.capa{border-bottom:3px solid #17663A;padding-bottom:10px;margin-bottom:6px}
h1{font-size:20px;color:#17663A;margin:0}h2{font-size:13px;margin:20px 0 6px;color:#17663A;text-transform:uppercase;letter-spacing:.5px}
p{margin:3px 0}table{border-collapse:collapse;width:100%;margin-top:4px}
th,td{border:1px solid #E1E5DA;padding:4px 6px;text-align:left;vertical-align:top}thead th{background:#ECEFE6}
.ficha th{width:40%;background:#F4F5EF;font-weight:600}.severo td{background:#FCE5E3}
.tipo{color:#5A675D;font-size:9px}.ocorrencia{border:1px solid #E1E5DA;border-radius:6px;padding:6px 8px;margin:6px 0}
.fotos{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}.fotos img{width:150px;height:110px;object-fit:cover;border-radius:4px}
.nota{color:#5A675D;font-size:9px;margin-top:20px;border-top:1px solid #E1E5DA;padding-top:8px}
</style></head><body>
<div class="capa"><h1>Dossiê climático do talhão</h1>
<p><strong>${escapar(d.talhao.nome)}</strong> · Safra ${escapar(d.safra.rotulo)} · ${dataCompleta(d.safra.inicio)} a ${dataCompleta(d.ate)}</p>
<p>Gerado em ${dataCompleta(d.geradoEm.slice(0, 10))} às ${escapar(d.geradoEm.slice(11, 16))} pelo app Grão Raiz.</p></div>
<h2>Identificação</h2><table class="ficha"><tbody>${identificacao}</tbody></table>
<h2>Resumo do clima na safra</h2><table class="ficha"><tbody>${resumo}</tbody></table>
<h2>Eventos adversos detectados</h2>${eventos}
<h2>Ocorrências registradas pelo produtor</h2>${ocorrencias}
<h2>Caderno de aplicações</h2>${aplicacoes}
<h2>Diário climático</h2><table><thead><tr><th>Data</th><th>Chuva</th><th>Origem</th><th>Mínima</th><th>Máxima</th><th>Rajada</th></tr></thead><tbody>${diario}</tbody></table>
<p class="nota">Documento de apoio organizado pelo produtor a partir das próprias anotações (pluviômetro, ocorrências, fotos e aplicações) e de estimativas de modelos meteorológicos e reanálise (linhas "Estimada"). Não substitui laudo, perícia ou vistoria. Prazos de comunicação de perdas seguem o contrato e as regras do Manual de Crédito Rural; na dúvida, comunique o agente financeiro ou a seguradora imediatamente. ${escapar(ATRIBUICAO_OPEN_METEO)}.</p>
</body></html>`;
}
