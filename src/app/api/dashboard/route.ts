import { NextResponse } from "next/server";
import { getTVDashboardData } from "@/lib/getDashboardData";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const data = await getTVDashboardData();
        return NextResponse.json(data);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
