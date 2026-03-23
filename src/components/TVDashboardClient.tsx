"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { TVDashboardData, FilialRow, SellerRow, HistoryRow } from "@/types/dashboard";
import { fmtBRL, fmtPct, fmtShort, fmtNumber } from "@/lib/utils";

const Clock = dynamic(() => import("./Clock"), { ssr: false });

// ---------- helper ----------
function n(v: unknown): number {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
}

// ---------- mini progress bar ----------
function Bar({
    pct,
    hit,
    small,
}: {
    pct: number;
    hit: boolean;
    small?: boolean;
}) {
    const capped = Math.min(Math.max(pct, 0), 100);
    return (
        <div
            className={`relative rounded-full overflow-hidden bg-slate-100 ${small ? "h-1.5" : "h-2"}`}
        >
            <div
                className={`absolute left-0 top-0 h-full rounded-full bar-grow ${hit
                    ? "bg-gradient-to-r from-green-500 to-emerald-400"
                    : pct > 70
                        ? "bg-gradient-to-r from-yellow-500 to-amber-400"
                        : "bg-gradient-to-r from-blue-600 to-blue-400"
                    }`}
                style={{ width: `${capped}%` }}
            />
        </div>
    );
}

// ---------- Kpi card topo ----------
function KpiCard({
    label,
    value,
    sub,
    color,
    icon,
}: {
    label: string;
    value: string;
    sub?: string;
    color?: string;
    icon?: string;
}) {
    return (
        <div className="flex flex-col gap-0.5 bg-white shadow-sm border border-slate-200 rounded-xl px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {icon && <span className="mr-1">{icon}</span>}
                {label}
            </div>
            <div className={`text-2xl font-black tabular-nums ${color ?? "text-slate-800"}`}>
                {value}
            </div>
            {sub && <div className="text-[11px] text-slate-500 font-medium">{sub}</div>}
        </div>
    );
}

// ---------- Filial card ----------
function FilialCard({ row }: { row: FilialRow }) {
    const hit = row.pct >= 100;
    const over = row.pct >= 110;
    return (
        <div className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 flex flex-col gap-1">
            <div className="flex items-center justify-between gap-1">
                <span className="text-[9px] font-bold text-slate-500 truncate uppercase tracking-wider">
                    {row.name}
                </span>
                <span
                    className={`text-[11px] font-black tabular-nums ${over ? "text-amber-500 glow-yellow" : hit ? "text-emerald-500 glow-green" : "text-indigo-600"
                        }`}
                >
                    {fmtPct(row.pct)}
                </span>
            </div>
            <Bar pct={row.pct} hit={hit} small />
            <div className="flex justify-between text-[8px] text-slate-500">
                <span title={`Bruto: ${fmtBRL(row.realized)}`}>{fmtBRL(row.realized_liq)}</span>
                <span className="text-slate-400">/ {fmtBRL(row.goal)}</span>
            </div>
            <div className="flex justify-between items-center -mt-0.5">
                <span className="text-[8px] text-slate-500">
                    Hoje: <span className="text-emerald-500 font-semibold">{fmtBRL(row.realized_today)}</span>
                </span>
                <span className="text-[8px] text-slate-500 font-medium">
                    Lucro Presente: <span className={row.profit_pct >= 0 ? "text-emerald-500" : "text-red-500"}>{fmtPct(row.profit_pct)}</span>
                </span>
            </div>
        </div>
    );
}

// ---------- Seller row mensal ----------
function SellerRowMonthly({ row, rank }: { row: SellerRow; rank: number }) {
    const hit = row.pct_achieved >= 100;
    const over = row.pct_achieved >= 110;
    return (
        <div className="flex items-center gap-1.5 px-1.5 py-0.5 border border-slate-200/60 bg-white/50 rounded-lg hover:bg-white hover:shadow-md transition-all">
            <div
                className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${rank <= 3 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"
                    }`}
            >
                {rank}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center gap-1 mb-0.5">
                    <span className="text-[10px] font-bold text-slate-800 truncate">
                        {row.seller_name.split(" ")[0]}
                    </span>
                    <span
                        className={`text-[10px] font-black tabular-nums shrink-0 ${over ? "text-amber-500" : hit ? "text-emerald-500" : "text-indigo-600"
                            }`}
                    >
                        {fmtPct(row.pct_achieved)}
                    </span>
                </div>
                <Bar pct={row.pct_achieved} hit={hit} small />
                <div className="flex justify-between items-center mt-0.5 h-3 leading-none">
                    <span className="text-[8px] text-slate-400">{fmtBRL(row.net_sales)}</span>
                    <span className="text-[8px] text-slate-900">meta {fmtBRL(row.goal_meta)}</span>
                </div>
            </div>
        </div>
    );
}

// ---------- Seller row semanal ----------
function SellerRowWeekly({ row, rank }: { row: SellerRow; rank: number }) {
    const hit = row.weekly_realized >= row.weekly_meta && row.weekly_meta > 0;
    const pct = n(row.weekly_pct_achieved);
    return (
        <div className="flex items-center gap-1.5 px-1.5 py-0.5 border border-slate-200/60 bg-white/50 rounded-lg hover:bg-white hover:shadow-md transition-all">
            <div
                className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${rank <= 3 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"
                    }`}
            >
                {rank}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center gap-1 mb-0.5">
                    <span className="text-[10px] font-bold text-slate-800 truncate">
                        {row.seller_name.split(" ")[0]}
                    </span>
                    <span
                        className={`text-[10px] font-black tabular-nums shrink-0 ${hit ? "text-emerald-500" : "text-indigo-600"
                            }`}
                    >
                        {fmtPct(pct)}
                    </span>
                </div>
                <Bar pct={pct} hit={hit} small />
                <div className="flex justify-between items-center mt-0.5 h-3 leading-none">
                    <span className="text-[8px] text-slate-400">{fmtBRL(row.weekly_realized)}</span>
                    {hit && row.weekly_bonus > 0 ? (
                        <span className="text-[8px] text-emerald-500 font-semibold">bônus {fmtBRL(row.weekly_bonus)}</span>
                    ) : (
                        <span className="text-[8px] text-slate-900">meta {fmtBRL(row.weekly_meta)}</span>
                    )}
                </div>
            </div>
        </div>
    );
}

// ---------- Positivação seller ----------
function PosSellerRow({ row, rank }: { row: SellerRow; rank: number }) {
    const pct = n(row.wallet_positive_pct);
    const hit = pct >= 60;
    return (
        <div className="flex items-center gap-1.5 px-1.5 py-0.5 border border-slate-200/60 bg-white/50 rounded-lg hover:bg-white hover:shadow-md transition-all">
            <div
                className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${rank <= 3 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"
                    }`}
            >
                {rank}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center gap-1 mb-0.5">
                    <span className="text-[10px] font-bold text-slate-800 truncate">
                        {row.seller_name.split(" ")[0]}
                    </span>
                    <span className={`text-[10px] font-black shrink-0 ${hit ? "text-emerald-500" : "text-slate-500"}`}>
                        {fmtPct(pct)}
                    </span>
                </div>
                <Bar pct={pct} hit={hit} small />
                <div className="flex items-center mt-0.5 h-3 leading-none">
                    <span className="text-[8px] text-slate-400">
                        {row.wallet_positive_month}/{row.wallet_total} clientes
                    </span>
                </div>
            </div>
        </div>
    );
}

// ---------- Lucratividade seller ----------
function ProfitSellerRow({ row, rank }: { row: SellerRow; rank: number }) {
    const pct = n(row.profit_pct);
    const meta = n(row.profit_meta_pct);
    const hit = meta > 0 ? pct >= meta : pct >= 20;
    // barra: % do atingimento em relação à meta (capped 100)
    const barPct = meta > 0 ? Math.min((pct / meta) * 100, 100) : Math.min((pct / 20) * 100, 100);
    return (
        <div className="flex items-center gap-1.5 px-1.5 py-0.5 border border-slate-200/60 bg-white/50 rounded-lg hover:bg-white hover:shadow-md transition-all">
            <div
                className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${rank <= 3 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"
                    }`}
            >
                {rank}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center gap-1 mb-0.5">
                    <span className="text-[10px] font-bold text-slate-800 truncate">
                        {row.seller_name.split(" ")[0]}
                    </span>
                    <span className={`text-[10px] font-black shrink-0 ${pct >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {fmtPct(pct)}
                    </span>
                </div>
                <Bar pct={barPct} hit={hit} small />
                <div className="flex justify-between items-center mt-0.5 h-3 leading-none">
                    <div className="flex items-center gap-1">
                        <span className={`text-[8px] font-bold ${(row.profit_abs || 0) >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                            {fmtBRL(row.profit_abs || 0)}
                        </span>
                        <span className="text-[7px] uppercase tracking-tighter text-slate-400 font-bold">
                            — Lucro
                        </span>
                    </div>
                    {meta > 0 && (
                        <span className="text-[8px] text-slate-400">
                            meta {fmtPct(meta)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

// ---------- Resumo último quadrimestre ----------
function LastQuadrimestreCard({ months }: { months: HistoryRow[] }) {
    if (!months || months.length === 0) return null;

    const currentMonth = new Date().getMonth() + 1;
    const currentQ = Math.floor((currentMonth - 1) / 4) + 1;
    let lastQNum = currentQ - 1;
    let qYear = new Date().getFullYear();
    if (lastQNum === 0) { lastQNum = 3; qYear -= 1; }

    const label = `${lastQNum}º Quadrimestre / ${qYear}`;

    // Totais do quadrimestre
    const totalRealized = months.reduce((s, m) => s + m.total_realized, 0);
    const totalProfitAbs = months.reduce((s, m) => s + m.total_profit_abs, 0);
    const totalProfitPct = totalRealized > 0 ? (totalProfitAbs / totalRealized) * 100 : 0;

    return (
        <div className="flex flex-col px-2 py-2 border-t border-slate-200 bg-slate-50/80 shrink-0">
            {/* HERO AREA para consolidado mais compacta */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-2">
                <div className="bg-slate-50 px-2.5 py-1.5 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[14px]">🏆</span>
                        <div className="flex flex-col">
                            <span className="text-[7px] font-semibold text-slate-400 uppercase tracking-widest leading-none">Resultado Consolidado</span>
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tight leading-none">{label} (FECHADO)</span>
                        </div>
                    </div>
                    <div className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border
                        ${totalProfitPct >= 20 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}`}>
                        {fmtPct(totalProfitPct)}
                    </div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-slate-100 p-1.5">
                    <div className="flex flex-col px-1 justify-center">
                        <span className="text-[7px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Venda Total</span>
                        <span className="text-[14px] font-bold text-slate-800 tabular-nums leading-none tracking-tight">{fmtBRL(totalRealized)}</span>
                    </div>
                    <div className="flex flex-col px-1 items-end justify-center">
                        <span className="text-[7px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Lucro Presente</span>
                        <span className={`text-[14px] font-bold tabular-nums leading-none tracking-tight ${totalProfitAbs >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                            {fmtBRL(totalProfitAbs)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-1">
                {months.map((m, i) => {
                    const parts = (m.month_key || "").split("-");
                    const year = parts[0] || "";
                    const month = parts[1] || "";
                    const labels: Record<string, string> = {
                        "01": "JAN", "02": "FEV", "03": "MAR", "04": "ABR", "05": "MAI", "06": "JUN",
                        "07": "JUL", "08": "AGO", "09": "SET", "10": "OUT", "11": "NOV", "12": "DEZ"
                    };
                    const isPositive = m.profit_pct >= 0;
                    return (
                        <div key={m.month_key || String(i)} className="bg-white border border-slate-200 rounded-lg py-1 px-1.5 shadow-sm flex flex-col justify-between h-[68px]">
                            <div className="flex justify-between items-center border-b border-slate-50 pb-0.5 mb-0.5">
                                <span className="text-[9px] font-bold text-slate-500">
                                    {(labels[month] || month)}{year ? `/${year.slice(2)}` : ""}
                                </span>
                                <div className={`px-1 py-0.5 rounded text-[8px] font-bold ${isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                                    {fmtPct(m.profit_pct)}
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <div className="text-[10.5px] font-bold text-slate-800 tabular-nums leading-none mb-0.5">
                                    {fmtBRL(m.total_realized)}
                                </div>
                                <div className="flex flex-col">
                                    <span className={`text-[9px] font-medium tabular-nums leading-none ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
                                        {fmtBRL(m.total_profit_abs)}
                                    </span>
                                    <span className="text-[5px] uppercase text-slate-350 font-bold tracking-widest mt-0.5">LUCRO PRESENTE</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ---------- Crescimento quadrimestral ----------
function HistorySection({ history }: { history: any[] }) {
    if (!history || history.length === 0) return null;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    const q = Math.floor((currentMonth - 1) / 4) + 1;
    const qLabel = `${q}º Quadrimestre / ${currentYear}`;

    // Filtrar apenas meses do quadrimestre atual que já fecharam
    const startMonth = (q - 1) * 4 + 1;
    const filteredHistory = history.filter(m => {
        const [y, mo] = (m.month_key || "").split("-").map(Number);
        return y === currentYear && mo >= startMonth && mo < currentMonth;
    });

    const totalRealized = filteredHistory.reduce((s, m) => s + m.total_realized, 0);
    const totalProfitAbs = filteredHistory.reduce((s, m) => s + m.total_profit_abs, 0);
    const totalProfitPct = totalRealized > 0 ? (totalProfitAbs / totalRealized) * 100 : 0;

    return (
        <div className="flex flex-col px-2 py-2 border-t border-slate-200 bg-slate-50/80 shrink-0">
            {/* Banner Área de Evolução mais compacto */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-2">
                <div className="bg-slate-50 px-2.5 py-1.5 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[14px]">📉</span>
                        <div className="flex flex-col">
                            <span className="text-[7px] font-semibold text-slate-400 uppercase tracking-widest leading-none">Evolução do Período</span>
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tight leading-none">Histórico: {qLabel} (MESES FECHADOS)</span>
                        </div>
                    </div>
                    <div className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border
                        ${totalProfitPct >= 20 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}`}>
                        {fmtPct(totalProfitPct)}
                    </div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-slate-100 p-1.5">
                    <div className="flex flex-col px-1 justify-center">
                        <span className="text-[7px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Vendas (Closed)</span>
                        <span className="text-[14px] font-bold text-slate-800 tabular-nums leading-none tracking-tight">{fmtBRL(totalRealized)}</span>
                    </div>
                    <div className="flex flex-col px-1 items-end justify-center">
                        <span className="text-[7px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Lucro Presente</span>
                        <span className={`text-[14px] font-bold tabular-nums leading-none tracking-tight ${totalProfitAbs >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                            {fmtBRL(totalProfitAbs)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-1">
                {filteredHistory.map((m, i) => {
                    const parts = (m.month_key || "").split("-");
                    const year = parts[0] || "";
                    const month = parts[1] || "";
                    const labels: Record<string, string> = {
                        "01": "JAN", "02": "FEV", "03": "MAR", "04": "ABR", "05": "MAI", "06": "JUN",
                        "07": "JUL", "08": "AGO", "09": "SET", "10": "OUT", "11": "NOV", "12": "DEZ"
                    };
                    const isPositive = m.profit_pct >= 0;
                    return (
                        <div key={m.month_key || String(i)} className="bg-white border border-slate-200 rounded-lg py-1 px-1.5 shadow-sm flex flex-col justify-between h-[68px]">
                            <div className="flex justify-between items-center border-b border-slate-50 pb-0.5 mb-0.5">
                                <span className="text-[9px] font-bold text-slate-500">
                                    {(labels[month] || month)}{year ? `/${year.slice(2)}` : ""}
                                </span>
                                <div className={`px-1 py-0.5 rounded text-[8px] font-bold ${isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                                    {fmtPct(m.profit_pct)}
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <div className="text-[10.5px] font-bold text-slate-800 tabular-nums leading-none mb-0.5">
                                    {fmtBRL(m.total_realized)}
                                </div>
                                <div className="flex flex-col">
                                    <span className={`text-[9px] font-medium tabular-nums leading-none ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
                                        {fmtBRL(m.total_profit_abs)}
                                    </span>
                                    <span className="text-[5px] uppercase text-slate-350 font-bold tracking-widest mt-0.5">LUCRO PRESENTE</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ---------- Section header ----------
function SectionHeader({ icon, title, badge }: { icon: string; title: string; badge?: string }) {
    return (
        <div className="flex items-center gap-1.5 mb-0.5 px-1 shrink-0">
            <span className="text-sm">{icon}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{title}</span>
            {badge && (
                <span className="ml-auto text-[8px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                    {badge}
                </span>
            )}
        </div>
    );
}

// ============================================================
//  MAIN CLIENT COMPONENT
// ============================================================
export default function TVDashboardClient({ data }: { data: TVDashboardData }) {
    const router = useRouter();

    useEffect(() => {
        const interval = setInterval(() => {
            router.refresh(); // Atualiza os dados do Server Component sem recarregar a página
        }, 10000); // 10 segundos (quase tempo real)

        return () => clearInterval(interval);
    }, [router]);

    const {
        totalGoal,
        totalRealized,
        totalProductsGross,
        totalReturn,
        totalPct,
        totalClosedBudgets,
        todayClosedBudgets,
        todayRealized,
        businessDaysElapsed,
        businessDaysMonth,
        businessDaysRemaining,
        filiais,
        sellers,
        positivacaoPct,
        positivacaoPositive,
        positivacaoTotal,
        totalProfitMonth,
        totalProfitToday,
        totalProfitPct,
        totalFrete,
        totalOutros,
    } = data;

    const hitGeral = totalPct >= 100;
    const overGeral = totalPct >= 110;

    // Sort
    const sellersWeek = [...sellers].sort(
        (a, b) =>
            n(b.weekly_pct_achieved) - n(a.weekly_pct_achieved) ||
            n(b.weekly_realized) - n(a.weekly_realized)
    );
    const sellersMonth = [...sellers].sort(
        (a, b) => n(b.pct_achieved) - n(a.pct_achieved) || n(b.net_sales) - n(a.net_sales)
    );
    const sellersPos = [...sellers].sort(
        (a, b) => n(b.wallet_positive_pct) - n(a.wallet_positive_pct)
    );
    const sellersProfit = [...sellers].sort(
        (a, b) => n(b.profit_pct) - n(a.profit_pct)
    );

    return (
        <div className="h-screen w-screen flex flex-col bg-slate-50 overflow-hidden">
            {/* ===== TOP BAR ===== */}
            <div className="shrink-0 flex items-center justify-between px-2 py-1 bg-slate-50 border-b border-slate-200 shadow-2xl">
                <div className="flex items-center gap-3"></div>
                {/* KPIs topo */}
                <div className="flex-1 flex items-center justify-around gap-1 px-2">
                    {/* Meta geral */}
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Meta (mês)</span>
                        <span className="text-[14px] font-black text-slate-800 tabular-nums">{fmtBRL(totalGoal)}</span>
                        {/* Atingimento */}
                        <span className={`text-[12px] font-black tabular-nums ${overGeral ? "text-amber-500 glow-yellow" : hitGeral ? "text-emerald-500 glow-green" : "text-blue-500"}`}>
                            {fmtPct(totalPct)}
                        </span>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />

                    {/* Realizado Líquido (Main) */}
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Realizado</span>
                        <span className="text-[14px] font-black text-emerald-500 tabular-nums glow-green leading-none">
                            {fmtBRL(totalRealized)}
                        </span>
                        <span className="text-[7.5px] font-bold text-slate-500 opacity-80 uppercase mt-1">
                            Méd. {fmtBRL(businessDaysElapsed > 0 ? totalRealized / businessDaysElapsed : 0)}/dia
                        </span>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />

                    {/* Realizado Hoje */}
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Realizado Hoje</span>
                        <span className="text-[14px] font-black text-indigo-600 tabular-nums">
                            {fmtBRL(todayRealized)}
                        </span>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />

                    {/* Venda Estimada*/}
                    <div className="flex flex-col items-center px-1">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-indigo-600">Venda Estimada</span>
                        <span className="text-[14px] font-black text-indigo-600 tabular-nums">
                            {fmtBRL(businessDaysElapsed > 0 ? (totalRealized / businessDaysElapsed) * businessDaysMonth : totalRealized)}
                        </span>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />

                    {/* Frete */}
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Frete</span>
                        <span className="text-[12px] font-bold text-slate-500 tabular-nums">
                            {fmtBRL(totalFrete)}
                        </span>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />

                    {/* Outras Despesas */}
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Outras Desp.</span>
                        <span className="text-[12px] font-bold text-slate-500 tabular-nums">
                            {fmtBRL(totalOutros)}
                        </span>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />

                    {/* Pedidos */}
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Pedidos</span>
                        <div className="flex gap-2">
                            <div className="flex flex-col items-center">
                                <span className="text-[12px] font-black text-slate-800">{fmtNumber(totalClosedBudgets)}</span>
                                <span className="text-[6px] font-bold text-slate-500 uppercase">Mês</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[12px] font-black text-indigo-600">{fmtNumber(todayClosedBudgets)}</span>
                                <span className="text-[6px] font-bold text-slate-500 uppercase">Hoje</span>
                            </div>
                        </div>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />

                    {/* Lucro Presente Hoje */}
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Lucro Presente Hoje</span>
                        <span className="text-[14px] font-black text-emerald-500 tabular-nums">
                            {fmtBRL(totalProfitToday)}
                        </span>
                        <span className={`text-[8px] font-bold uppercase px-1 rounded ${totalProfitToday >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                            {fmtPct(todayRealized > 0 ? (totalProfitToday / todayRealized) * 100 : 0, 3)}
                        </span>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />

                    {/* Lucro Presente Mês */}
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Lucro Presente Mês</span>
                        <span className="text-[14px] font-black text-emerald-600 tabular-nums">
                            {fmtBRL(totalProfitMonth)}
                        </span>
                        <span className={`text-[8px] font-bold uppercase px-1 rounded ${totalProfitPct >= 0 ? "text-emerald-500" : "bg-yellow-300 text-yellow-900"}`}>
                            {fmtPct(totalProfitPct, 3)}
                        </span>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />

                    {/* Positivação */}
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Positivação</span>
                        <span className={`text-[14px] font-black tabular-nums ${positivacaoPct >= 60 ? "text-emerald-500" : "text-amber-500"}`}>
                            {fmtPct(positivacaoPct)}
                        </span>
                        <span className="text-[8px] font-bold text-slate-500 opacity-80">
                            {positivacaoPositive}/{positivacaoTotal} clis.
                        </span>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />

                    {/* Dias úteis */}
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Dias Úteis</span>
                        <div className="flex gap-2">
                            <div className="flex flex-col items-center">
                                <span className="text-[12px] font-black text-slate-800">{businessDaysElapsed}</span>
                                <span className="text-[6px] font-bold text-slate-500 uppercase">Corridos</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[12px] font-black text-slate-500">{businessDaysMonth}</span>
                                <span className="text-[6px] font-bold text-slate-500 uppercase">Totais</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[12px] font-black text-red-500">{businessDaysRemaining}</span>
                                <span className="text-[6px] font-bold text-red-500 uppercase">Restam</span>
                            </div>
                        </div>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />

                    <div className="flex flex-col items-end justify-center min-w-[80px]">
                        <Clock />
                        {data.lastSync?.end && (
                            <span className="text-[9px] text-slate-500 opacity-80 mt-1" title={`Início: ${data.lastSync.start}`}>
                                {(() => {
                                    const [datePart, timePart] = data.lastSync!.end.split(" ");
                                    const [y, m, d] = datePart.split("-");
                                    const hora = timePart?.split(".")[0] ?? "";
                                    return `Sync: ${d}/${m} ${hora}`;
                                })()}
                            </span>
                        )}
                    </div>
                </div>

            </div>

            {/* ===== BARRA DE PROGRESSO GERAL ===== */}
            <div className="shrink-0 px-4 py-1 bg-white shadow-sm border-b border-slate-200">
                <Bar pct={totalPct} hit={hitGeral} />
            </div>

            {/* ===== MAIN GRID ===== */}
            <div className="flex-1 min-h-0 grid grid-cols-[220px_2fr_2fr] gap-0 overflow-hidden">

                {/* ---- COL 1: FILIAIS ---- */}
                <div className="flex flex-col border-r border-slate-200 px-2 py-2 gap-1 overflow-hidden">
                    <SectionHeader icon="🏢" title="Filiais" badge={`${filiais.length} filiais`} />
                    {filiais.map((f) => (
                        <FilialCard key={`filial-${f.empresa_id}`} row={f} />
                    ))}
                </div>

                {/* ---- COL 2 & 3: RANKING MENSAL E SEMANAL + LAST Q ---- */}
                <div className="flex flex-col border-r border-slate-200 overflow-hidden">
                    <div className="flex-1 min-h-0 grid grid-cols-2">
                        {/* MENSAL */}
                        <div className="flex flex-col border-r border-slate-200 px-2 py-1 gap-0.5 overflow-hidden">
                            <SectionHeader icon="📅" title="Ranking Mensal" />
                            {sellersMonth.map((s, i) => (
                                <SellerRowMonthly key={`month-${s.seller_id}`} row={s} rank={i + 1} />
                            ))}
                        </div>
                        {/* SEMANAL */}
                        <div className="flex flex-col px-2 py-1 gap-0.5 overflow-hidden">
                            <SectionHeader icon="📆" title="Ranking Semanal" />
                            {sellersWeek.map((s, i) => (
                                <SellerRowWeekly key={`week-${s.seller_id}`} row={s} rank={i + 1} />
                            ))}
                        </div>
                    </div>
                    {/* RESULTADO ÚLTIMO QUADRIMESTRE */}
                    <LastQuadrimestreCard months={data.lastQuadrimestreMonths} />
                </div>

                {/* ---- COL 4 & 5: POSITIVAÇÃO, LUCRATIVIDADE & HISTORY ---- */}
                <div className="flex flex-col overflow-hidden border-l border-slate-00">
                    <div className="flex-1 min-h-0 grid grid-cols-2">
                        {/* POSITIVAÇÃO */}
                        <div className="flex flex-col border-r border-slate-200 px-2 py-1 gap-0.5 overflow-hidden">
                            <SectionHeader icon="✅" title="Positivação" />
                            {sellersPos.map((s, i) => (
                                <PosSellerRow key={`pos-${s.seller_id}`} row={s} rank={i + 1} />
                            ))}
                        </div>
                        {/* LUCRATIVIDADE */}
                        <div className="flex flex-col px-2 py-1 gap-0.5 overflow-hidden">
                            <SectionHeader icon="💰" title="Lucro Presente" />
                            {sellersProfit.map((s, i) => (
                                <ProfitSellerRow key={`profit-${s.seller_id}`} row={s} rank={i + 1} />
                            ))}
                        </div>
                    </div>
                    {/* HISTÓRICO DE CRESCIMENTO */}
                    <HistorySection history={data.history} />
                </div>
            </div>

        </div>
    );
}