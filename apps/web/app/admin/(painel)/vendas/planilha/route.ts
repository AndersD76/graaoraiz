import { adminAtual, registrarAcao } from '@/lib/admin/auth';
import { vendas } from '@/lib/admin/consultas';

/** Célula de CSV segura: aspas escapadas e sem fórmula (=, +, -, @ no começo viram texto no Excel). */
function celula(v: unknown): string {
  let s = v instanceof Date ? v.toISOString() : String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/** GET /admin/vendas/planilha → todas as vendas em CSV (separador ;, para abrir direto no Excel em português). */
export async function GET() {
  const admin = await adminAtual();
  if (!admin) return new Response('Entre no painel.', { status: 401 });
  const linhas = await vendas('todas', 10_000);
  const cabecalho = ['anuncio', 'maquina', 'categoria', 'vendedor', 'email', 'whatsapp', 'valor_venda', 'comissao_percentual', 'comissao_valor', 'vendido_em', 'comissao_paga_em'];
  const corpo = linhas.map((v) =>
    [v.anuncio_id, v.titulo, v.categoria, v.vendedor_nome, v.vendedor_email, v.whatsapp, v.valor_venda, v.comissao_percentual, v.comissao_valor, v.vendido_em, v.comissao_paga_em ?? '']
      .map(celula)
      .join(';'),
  );
  await registrarAcao(admin, 'planilha_vendas', null, { linhas: linhas.length });
  return new Response(`﻿${[cabecalho.join(';'), ...corpo].join('\r\n')}\r\n`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="vendas-grao-raiz-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
