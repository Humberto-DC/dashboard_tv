export interface LogisticoCusto {
    id: string;
    categoria: string;
    valor: number;
    data: string;
    empresa: string;
}

export interface MaterialMovimentacao {
    id: string;
    material: string;
    quantidade: number;
    unidade: string;
    direcao: 'entrada' | 'saida';
    metodo: 'transportadora' | 'retirada_cliente';
    status: 'pendente' | 'em_transito' | 'concluido';
    dataPrevista: string;
    entidade: string; // Nome da transportadora ou cliente
}

export interface LogisticaSummary {
    custos: LogisticoCusto[];
    movimentacoes: MaterialMovimentacao[];
}
