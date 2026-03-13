"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { TVDashboardData, FilialRow, SellerRow, HistoryRow } from "@/types/dashboard";
import { fmtBRL, fmtPct, fmtShort, fmtNumber } from "@/lib/utils";

const Clock = dynamic(() => import("./Clock"), { ssr: false });

// Helper to handle numbers
function n(v: unknown): number {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
}

// ---------- Progress Bar Fiel (Igual TV) ----------
function ProgressBar({ pct, hit, height = "h-2" }: { pct: number; hit: boolean; height?: string }) {
    const capped = Math.min(Math.max(pct, 0), 100);
    return (
        <div className={`relative rounded-full overflow-hidden bg-slate-100 ${height} w-full`}>
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

// ---------- KPI Card Fiel (Igual TV) ----------
function MobileKpi({ label, value, sub, color, icon, glow }: { label: string; value: string; sub?: React.ReactNode; color?: string; icon?: string; glow?: boolean }) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 flex flex-col gap-0.5 shadow-sm">
            <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
                {icon && <span>{icon}</span>}
                {label}
            </div>
            <div className={`text-xl font-black tabular-nums transition-all ${color ?? "text-slate-800"} ${glow ? "glow-green" : ""}`}>
                {value}
            </div>
            {sub && <div className="text-[10px] text-slate-500 font-medium leading-tight">{sub}</div>}
        </div>
    );
}

// ---------- Filial Card Fiel (Igual TV) ----------
function MobileFilialCard({ row }: { row: FilialRow }) {
    const hit = row.pct >= 100;
    const over = row.pct >= 110;
    return (
        <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex flex-col gap-1.5 shadow-sm">
            <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold text-slate-500 truncate uppercase tracking-wider">
                    {row.name}
                </span>
                <span className={`text-[13px] font-black tabular-nums ${over ? "text-amber-500 glow-yellow" : hit ? "text-emerald-500 glow-green" : "text-indigo-600"}`}>
                    {fmtPct(row.pct)}
                </span>
            </div>
            <ProgressBar pct={row.pct} hit={hit} height="h-1.5" />
            <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                <span>{fmtBRL(row.realized_liq)}</span>
                <span className="text-slate-400">/ {fmtBRL(row.goal)}</span>
            </div>
            <div className="flex justify-between items-center text-[9px] text-slate-500 pt-0.5 border-t border-slate-200/50 mt-0.5">
                <span>Hoje: <span className="text-emerald-500 font-bold">{fmtBRL(row.realized_today)}</span></span>
                <span>Margem: <span className={`font-bold ${row.profit_pct >= 0 ? "text-emerald-500" : "text-red-500"}`}>{fmtPct(row.profit_pct)}</span></span>
            </div>
        </div>
    );
}

// ---------- Seller Row Mobile ----------
// ---------- Seller Row Fiel (Igual TV) ----------
function MobileSellerRow({ row, rank, type }: { row: SellerRow; rank: number; type: "monthly" | "weekly" | "pos" | "profit" }) {
    let pct = 0;
    let mainVal = "";
    let subVal = "";
    let hit = false;
    let over = false;

    if (type === "monthly") {
        pct = row.pct_achieved;
        mainVal = fmtBRL(row.net_sales);
        subVal = `meta ${fmtShort(row.goal_meta)}`;
        hit = pct >= 100;
        over = pct >= 110;
    } else if (type === "weekly") {
        pct = n(row.weekly_pct_achieved);
        mainVal = fmtBRL(row.weekly_realized);
        subVal = `meta ${fmtShort(row.weekly_meta)}`;
        hit = row.weekly_realized >= row.weekly_meta && row.weekly_meta > 0;
    } else if (type === "pos") {
        pct = n(row.wallet_positive_pct);
        mainVal = `${row.wallet_positive_month}/${row.wallet_total}`;
        subVal = "clientes";
        hit = pct >= 60;
    } else if (type === "profit") {
        pct = n(row.profit_pct);
        mainVal = fmtBRL(row.profit_abs || 0);
        subVal = "lucro abs.";
        hit = pct >= 20;
    }

    return (
        <div className="flex items-center gap-2 px-2 py-1.5 border border-slate-200/60 bg-white shadow-sm rounded-lg">
            <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${rank <= 3 ? "bg-amber-100 text-amber-600 border border-amber-200" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                {rank}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center gap-1 mb-0.5">
                    <span className="text-[11px] font-bold text-slate-800 truncate">{row.seller_name.split(" ")[0]}</span>
                    <span className={`text-[11px] font-black tabular-nums shrink-0 ${over ? "text-amber-500" : hit ? "text-emerald-500" : "text-indigo-600"}`}>
                        {fmtPct(pct)}
                    </span>
                </div>
                <ProgressBar pct={type === "profit" ? Math.min((pct / 20) * 100, 100) : pct} hit={hit} height="h-1 shadow-none" />
                <div className="flex justify-between items-center mt-1 leading-none">
                    <span className="text-[9px] text-slate-400 font-bold">{mainVal}</span>
                    <span className="text-[8px] text-slate-500 uppercase font-medium">{subVal}</span>
                </div>
            </div>
        </div>
    );
}

// ---------- Resumo Quadrimestre Mobile ----------
// ---------- Resumo Quadrimestre Fiel (Igual TV) ----------
function MobileLastQuadrimestre({ months }: { months: HistoryRow[] }) {
    if (!months || months.length === 0) return null;

    const currentMonth = new Date().getMonth() + 1;
    const currentQ = Math.floor((currentMonth - 1) / 4) + 1;
    let lastQNum = currentQ - 1;
    let qYear = new Date().getFullYear();
    if (lastQNum === 0) { lastQNum = 3; qYear -= 1; }

    const label = `${lastQNum}º Quadrimestre / ${qYear}`;
    const totalRealized = months.reduce((s, m) => s + m.total_realized, 0);
    const totalProfitAbs = months.reduce((s, m) => s + m.total_profit_abs, 0);
    const totalProfitPct = totalRealized > 0 ? (totalProfitAbs / totalRealized) * 100 : 0;

    return (
        <div className="flex flex-col px-1 py-1 border border-slate-200 bg-slate-50/80 rounded-xl mt-4">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-2">
                <div className="bg-slate-50 px-2.5 py-1.5 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm">🏆</span>
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
                <div className="grid grid-cols-2 divide-x divide-slate-100 p-2">
                    <div className="flex flex-col px-1">
                        <span className="text-[7px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Venda Total</span>
                        <span className="text-[14px] font-black text-slate-800 leading-none">{fmtBRL(totalRealized)}</span>
                    </div>
                    <div className="flex flex-col px-1 items-end">
                        <span className="text-[7px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Lucro Presente</span>
                        <span className={`text-[14px] font-black leading-none ${totalProfitAbs >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                            {fmtBRL(totalProfitAbs)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                {months.map((m, i) => {
                    const isPositive = m.profit_pct >= 0;
                    return (
                        <div key={m.month_key || String(i)} className="bg-white border border-slate-200 rounded-lg p-2 shadow-sm flex flex-col justify-between h-[68px]">
                            <div className="flex justify-between items-center border-b border-slate-50 pb-1 mb-1">
                                <span className="text-[9px] font-bold text-slate-500">{(m.month_key || "").split("-")[1]}</span>
                                <div className={`px-1 py-0.5 rounded text-[8px] font-bold ${isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                                    {fmtPct(m.profit_pct)}
                                </div>
                            </div>
                            <div className="text-[10px] font-black text-slate-800">{fmtBRL(m.total_realized)}</div>
                            <div className={`text-[9px] font-bold ${isPositive ? "text-emerald-500" : "text-red-500"}`}>{fmtBRL(m.total_profit_abs)}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ---------- Evolução Histórico Fiel (Igual TV) ----------
function MobileHistorySection({ history }: { history: HistoryRow[] }) {
    if (!history || history.length === 0) return null;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const q = Math.floor((currentMonth - 1) / 4) + 1;
    const label = `${q}º Quadrimestre / ${currentYear}`;

    const startMonth = (q - 1) * 4 + 1;
    const filteredHistory = history.filter(m => {
        const [y, mo] = (m.month_key || "").split("-").map(Number);
        return y === currentYear && mo >= startMonth && mo < currentMonth;
    });

    if (filteredHistory.length === 0) return null;

    const totalRealized = filteredHistory.reduce((s, m) => s + m.total_realized, 0);
    const totalProfitAbs = filteredHistory.reduce((s, m) => s + m.total_profit_abs, 0);
    const totalProfitPct = totalRealized > 0 ? (totalProfitAbs / totalRealized) * 100 : 0;

    return (
        <div className="flex flex-col px-1 py-1 border border-slate-200 bg-slate-50/80 rounded-xl">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-2">
                <div className="bg-slate-50 px-2.5 py-1.5 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm">📉</span>
                        <div className="flex flex-col">
                            <span className="text-[7px] font-semibold text-slate-400 uppercase tracking-widest leading-none">Evolução do Quadrimestre</span>
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tight leading-none">{label} (ATUAL)</span>
                        </div>
                    </div>
                    <div className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border
                        ${totalProfitPct >= 20 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}`}>
                        {fmtPct(totalProfitPct)} mg
                    </div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-slate-100 p-2">
                    <div className="flex flex-col px-1">
                        <span className="text-[7px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Venda Total</span>
                        <span className="text-[14px] font-black text-slate-800 leading-none">{fmtBRL(totalRealized)}</span>
                    </div>
                    <div className="flex flex-col px-1 items-end">
                        <span className="text-[7px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Lucro Acumulado</span>
                        <span className={`text-[14px] font-black leading-none ${totalProfitAbs >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                            {fmtBRL(totalProfitAbs)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                {filteredHistory.map((m, i) => {
                    const isPositive = m.profit_pct >= 0;
                    return (
                        <div key={m.month_key || String(i)} className="bg-white border border-slate-200 rounded-lg p-2 shadow-sm flex flex-col justify-between h-[68px]">
                            <div className="flex justify-between items-center border-b border-slate-50 pb-1 mb-1">
                                <span className="text-[9px] font-bold text-slate-500">{(m.month_key || "").split("-")[1]}</span>
                                <div className={`px-1 py-0.5 rounded text-[8px] font-bold ${isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                                    {fmtPct(m.profit_pct)}
                                </div>
                            </div>
                            <div className="text-[10px] font-black text-slate-800">{fmtBRL(m.total_realized)}</div>
                            <div className={`text-[9px] font-bold ${isPositive ? "text-emerald-500" : "text-red-500"}`}>{fmtBRL(m.total_profit_abs)}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function MobileDashboardClient({ data }: { data: TVDashboardData }) {
    const router = useRouter();
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const interval = setInterval(() => {
            router.refresh();
            setLastRefresh(new Date());
        }, 30000); // 30s
        return () => clearInterval(interval);
    }, [router]);

    const {
        totalGoal, totalRealized, totalPct, todayRealized,
        businessDaysElapsed, businessDaysMonth, businessDaysRemaining,
        filiais, sellers, totalProfitMonth, totalProfitToday, totalProfitPct,
        positivacaoPct, positivacaoPositive, positivacaoTotal, lastSync,
        totalFrete, totalOutros, totalClosedBudgets, todayClosedBudgets,
        history, lastQuadrimestreMonths
    } = data;

    const sellersMonth = [...sellers].sort((a, b) => n(b.pct_achieved) - n(a.pct_achieved));
    const sellersWeek = [...sellers].sort((a, b) => n(b.weekly_pct_achieved) - n(a.weekly_pct_achieved) || n(b.weekly_realized) - n(a.weekly_realized));
    const sellersPos = [...sellers].sort((a, b) => n(b.wallet_positive_pct) - n(a.wallet_positive_pct));
    const sellersProfit = [...sellers].sort((a, b) => n(b.profit_pct) - n(a.profit_pct));

    return (
        <div className="min-h-screen bg-slate-50 pb-10">
            {/* Header Sticky Clean */}
            <div className="sticky top-0 z-50 bg-slate-50/90 backdrop-blur-xl border-b border-slate-200 px-4 py-3 flex justify-between items-center">
                <div className="flex flex-col">
                    <span className="text-[15px] font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Dashboard Mobile
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                        {isMounted ? lastRefresh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'} atualizado
                    </span>
                </div>
                <div className="flex flex-col items-end">
                    <div className="scale-90 origin-right">
                        {isMounted ? <Clock /> : '--:--'}
                    </div>
                    {lastSync?.end && (
                        <span className="text-[8px] text-slate-400 mt-1">
                            Sync: {lastSync.end.split(' ')[1]?.slice(0, 5)}
                        </span>
                    )}
                </div>
            </div>

            <div className="p-4 flex flex-col gap-6">

                {/* 1. KPIs Principais (IGUAL AO TOPO DA TV) */}
                <div className="grid grid-cols-2 gap-3">
                    <MobileKpi
                        label="Meta do Mês"
                        value={fmtBRL(totalGoal)}
                        icon="🎯"
                        sub={<div className="flex flex-col gap-1 mt-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Atingimento</span>
                            <span className={`text-sm font-black ${totalPct >= 110 ? "text-amber-500 glow-yellow" : totalPct >= 100 ? "text-emerald-500 glow-green" : "text-blue-500"}`}>
                                {fmtPct(totalPct)}
                            </span>
                            <ProgressBar pct={totalPct} hit={totalPct >= 100} height="h-1.5" />
                        </div>}
                    />
                    <MobileKpi
                        label="Realizado"
                        value={fmtBRL(totalRealized)}
                        color="text-emerald-500"
                        glow={totalPct >= 100}
                        icon="💰"
                        sub={<div className="flex flex-col">
                            <span className="text-slate-500">Méd {fmtBRL(businessDaysElapsed > 0 ? totalRealized / businessDaysElapsed : 0)}/dia</span>
                        </div>}
                    />
                    <MobileKpi
                        label="Venda Hoje"
                        value={fmtBRL(todayRealized)}
                        color="text-indigo-600"
                        icon="⚡"
                    />
                    <MobileKpi
                        label="Venda Estimada"
                        value={fmtBRL(businessDaysElapsed > 0 ? (totalRealized / businessDaysElapsed) * businessDaysMonth : totalRealized)}
                        icon="🔮"
                        color="text-indigo-600 font-black"
                    />
                </div>

                {/* 1.2. KPIs Operacionais (Metricas de apoio da TV) */}
                <div className="grid grid-cols-2 gap-3">
                    <MobileKpi
                        label="Pedidos"
                        value={fmtNumber(totalClosedBudgets)}
                        sub={<span className="text-indigo-600 font-bold italic">{fmtNumber(todayClosedBudgets)} hoje</span>}
                        icon="📦"
                    />
                    <MobileKpi
                        label="Positivação"
                        value={fmtPct(positivacaoPct)}
                        color={positivacaoPct >= 60 ? "text-emerald-500" : "text-amber-500"}
                        icon="✅"
                        sub={<span className="text-slate-400 font-bold uppercase text-[8px]">{positivacaoPositive} de {positivacaoTotal} clis.</span>}
                    />
                    <MobileKpi
                        label="Frete Total"
                        value={fmtBRL(totalFrete)}
                        icon="🚚"
                        color="text-slate-500"
                    />
                    <MobileKpi
                        label="Outras Despesas"
                        value={fmtBRL(totalOutros)}
                        icon="💸"
                        color="text-slate-500"
                    />
                </div>

                {/* 2. Lucro Presente (BOX DESTACADO IGUAL TV CLEAR) */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
                    <div className="flex flex-col gap-1 mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Lucro Presente Consolidado</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black tabular-nums text-emerald-500 glow-green">{fmtBRL(totalProfitMonth)}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${totalProfitPct >= 0 ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"}`}>
                                {fmtPct(totalProfitPct, 2)}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 border-t border-slate-100 pt-4">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Resultado Hoje</span>
                            <span className="text-lg font-black text-emerald-500">{fmtBRL(totalProfitToday)}</span>
                            <span className="text-[9px] font-bold text-slate-400">
                                {fmtPct(todayRealized > 0 ? (totalProfitToday / todayRealized) * 100 : 0, 2)} da venda
                            </span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Margem Base</span>
                            <span className={`text-lg font-black ${totalProfitPct >= 20 ? "text-emerald-500" : "text-amber-500"}`}>
                                {fmtPct(totalProfitPct)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. Dias Úteis (CLEAN THEME) */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex justify-around items-center">
                    <div className="flex flex-col items-center">
                        <span className="text-xl font-black text-slate-800">{businessDaysElapsed}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase text-center mt-0.5 tracking-widest">Corridos</span>
                    </div>
                    <div className="w-px h-8 bg-slate-100" />
                    <div className="flex flex-col items-center">
                        <span className="text-xl font-black text-slate-400">{businessDaysMonth}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase text-center mt-0.5 tracking-widest">Totais</span>
                    </div>
                    <div className="w-px h-8 bg-slate-100" />
                    <div className="flex flex-col items-center">
                        <span className="text-xl font-black text-red-500">{businessDaysRemaining}</span>
                        <span className="text-[9px] font-bold text-red-500 uppercase text-center mt-0.5 tracking-widest">Restam</span>
                    </div>
                </div>

                {/* 4. Filiais */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">🏢 Filiais</h3>
                    <div className="flex flex-col gap-3">
                        {filiais.map(f => (
                            <MobileFilialCard key={f.empresa_id} row={f} />
                        ))}
                    </div>
                </div>

                {/* 5. Ranking Mensal */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">📅 Ranking Mensal</h3>
                    <div className="flex flex-col gap-2">
                        {sellersMonth.map((s, i) => (
                            <MobileSellerRow key={`month-${s.seller_id}`} row={s} rank={i + 1} type="monthly" />
                        ))}
                    </div>
                </div>

                {/* 6. Ranking Semanal */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">📆 Ranking Semanal</h3>
                    <div className="flex flex-col gap-2">
                        {sellersWeek.map((s, i) => (
                            <MobileSellerRow key={`week-${s.seller_id}`} row={s} rank={i + 1} type="weekly" />
                        ))}
                    </div>
                </div>

                {/* 7. Ranking Positivação */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">✅ Ranking Positivação</h3>
                    <div className="flex flex-col gap-2">
                        {sellersPos.map((s, i) => (
                            <MobileSellerRow key={`pos-${s.seller_id}`} row={s} rank={i + 1} type="pos" />
                        ))}
                    </div>
                </div>

                {/* 8. Lucratividade */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">💰 Lucro Presente</h3>
                    <div className="flex flex-col gap-2">
                        {sellersProfit.map((s, i) => (
                            <MobileSellerRow key={`profit-${s.seller_id}`} row={s} rank={i + 1} type="profit" />
                        ))}
                    </div>
                </div>

                {/* 9. Histórico e Quadrimestre */}
                <MobileLastQuadrimestre months={lastQuadrimestreMonths} />
                <MobileHistorySection history={history} />

            </div>
        </div>
    );
}
