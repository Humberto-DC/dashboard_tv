export function fmtBRL(v: number) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 2,
    }).format(Number.isFinite(v) ? v : 0);
}

export function fmtPct(v: number, decimals = 3) {
    const n = Number.isFinite(v) ? v : 0;
    return `${n.toFixed(decimals)}%`;
}

export function fmtShort(v: number): string {
    if (!Number.isFinite(v)) return "R$ 0";
    if (Math.abs(v) >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
    if (Math.abs(v) >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}K`;
    return fmtBRL(v);
}

export function toNum(v: unknown): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

export function fmtNumber(v: number) {
    return new Intl.NumberFormat("pt-BR").format(Number.isFinite(v) ? v : 0);
}
