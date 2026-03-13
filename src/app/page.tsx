import { unstable_noStore as noStore } from "next/cache";
import TVDashboardClient from "@/components/TVDashboardClient";
import { getTVDashboardData } from "@/lib/getDashboardData";

export const dynamic = "force-dynamic";

export default async function TVDashboardPage() {
    noStore();

    let data;
    try {
        data = await getTVDashboardData();
    } catch (err) {
        console.error("TV Dashboard data error:", err);
        throw err;
    }

    return (
        <main className="h-screen w-screen overflow-hidden bg-[#0d1117]">
            <TVDashboardClient data={data} />
        </main>
    );
}
