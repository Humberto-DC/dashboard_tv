export type FilialRow = {
    empresa_id: number;
    name: string;
    goal: number;
    realized: number; // Bruto
    realized_liq: number; // Líquido
    pct: number; // % do Líquido
    realized_today: number;
    closed_budgets: number;
    today_closed_budgets: number;
    profit_pct: number;
    lucro_abs: number;
    lucro_abs_real?: number;
    lucro_hoje_abs: number;
    base_lucro_pres: number;
    return_val: number;
    frete_val: number;
    outros_val: number;
    products_gross: number;
};

export type SellerRow = {
    seller_id: number;
    seller_name: string;

    // mensal
    goal_meta: number;
    net_sales: number;
    pct_achieved: number;
    closed_budgets: number;

    // semanal
    weekly_meta: number;
    weekly_realized: number;
    weekly_pct_achieved: number;
    weekly_bonus: number;
    weekly_closed_budgets: number;

    // positivação
    wallet_total: number;
    wallet_positive_month: number;
    wallet_positive_pct: number;

    // lucro
    profit_pct?: number;
    profit_meta_pct?: number;
    profit_abs?: number;

    // hoje
    today_closed_budgets?: number;
    realized_today?: number;
};

export type TVDashboardData = {
    updatedAt: string;
    // Geral
    totalGoal: number;
    totalRealized: number; // Líquido (principal)
    totalProductsGross: number; // Bruto (apenas produtos)
    totalReturn: number; // Devolução
    totalPct: number;
    totalClosedBudgets: number;
    todayClosedBudgets: number;
    todayRealized: number;
    totalFrete: number;
    totalOutros: number;

    // Dias úteis
    businessDaysMonth: number;
    businessDaysElapsed: number;
    businessDaysRemaining: number;

    // Filiais
    filiais: FilialRow[];

    // Vendedores
    sellers: SellerRow[];

    // Positivação geral
    positivacaoPct: number;
    positivacaoTotal: number;
    positivacaoPositive: number;

    // Lucro empresa
    totalProfitMonth: number;
    totalProfitToday: number;
    totalProfitPct: number;
    history: HistoryRow[];
    lastQuadrimestreMonths: HistoryRow[];

    // Sync do banco
    lastSync?: {
        start: string;
        end: string;
    };
};

export interface HistoryRow {
    month_key: string;
    total_realized: number;
    total_profit_abs: number;
    profit_pct: number;
}
