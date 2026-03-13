import { getMockCustos, getMockMovimentacoes } from "../data/logisticaData";
import { LogisticaSummary } from "../types";

/**
 * Serviço responsável por buscar e processar dados de logística.
 * Atualmente utiliza mocks, mas está preparado para integração com DB.
 */
export async function getLogisticaData(): Promise<LogisticaSummary> {
    // Simulação de delay de rede
    // await new Promise(resolve => setTimeout(resolve, 500));

    const custos = getMockCustos();
    const movimentacoes = getMockMovimentacoes();

    return {
        custos,
        movimentacoes
    };
}

export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

export function getStatusColor(status: string) {
    switch (status) {
        case 'concluido': return 'text-emerald-400 bg-emerald-400/10';
        case 'em_transito': return 'text-sky-400 bg-sky-400/10';
        case 'pendente': return 'text-amber-400 bg-amber-400/10';
        default: return 'text-slate-400 bg-slate-400/10';
    }
}
