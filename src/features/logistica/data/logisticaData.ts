import { LogisticoCusto, MaterialMovimentacao } from "../types";

export const getMockCustos = (): LogisticoCusto[] => [
    { id: '1', categoria: 'Frete Terceirizado', valor: 45000.00, data: '2024-03-01', empresa: 'Empresa Alpha' },
    { id: '2', categoria: 'Combustível Frota', valor: 12500.50, data: '2024-03-01', empresa: 'Empresa Alpha' },
    { id: '3', categoria: 'Armazenagem', valor: 8900.00, data: '2024-03-01', empresa: 'Empresa Beta' },
    { id: '4', categoria: 'Manutenção Veicular', valor: 3400.20, data: '2024-03-01', empresa: 'Empresa Alpha' },
    { id: '5', categoria: 'Seguro Carga', valor: 5600.00, data: '2024-03-01', empresa: 'Empresa Gamma' },
];

export const getMockMovimentacoes = (): MaterialMovimentacao[] => [
    {
        id: 'm1',
        material: 'Cimento CP-II 50kg',
        quantidade: 200,
        unidade: 'Sacos',
        direcao: 'entrada',
        metodo: 'transportadora',
        status: 'em_transito',
        dataPrevista: '2024-03-05',
        entidade: 'TransLog express'
    },
    {
        id: 'm2',
        material: 'Piso Porcelanato 60x60',
        quantidade: 150,
        unidade: 'm2',
        direcao: 'saida',
        metodo: 'retirada_cliente',
        status: 'pendente',
        dataPrevista: '2024-03-01',
        entidade: 'João da Silva'
    },
    {
        id: 'm3',
        material: 'Argamassa AC-III',
        quantidade: 50,
        unidade: 'Sacos',
        direcao: 'entrada',
        metodo: 'transportadora',
        status: 'concluido',
        dataPrevista: '2024-02-28',
        entidade: 'Votoran'
    },
    {
        id: 'm4',
        material: 'Tinta Acrílica Branca 18L',
        quantidade: 30,
        unidade: 'Latas',
        direcao: 'saida',
        metodo: 'transportadora',
        status: 'em_transito',
        dataPrevista: '2024-03-02',
        entidade: 'Rápido Encomendas'
    },
    {
        id: 'm5',
        material: 'Telha Cerâmica',
        quantidade: 1000,
        unidade: 'Unidades',
        direcao: 'entrada',
        metodo: 'transportadora',
        status: 'pendente',
        dataPrevista: '2024-03-10',
        entidade: 'Cerâmica São José'
    }
];
