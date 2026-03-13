import { unstable_noStore as noStore } from "next/cache";
import MobileDashboardClient from "@/components/MobileDashboardClient";
import { getTVDashboardData } from "@/lib/getDashboardData";

/**
 * Página principal do dashboard otimizada para dispositivos móveis.
 * Acessível via /mobile
 */

export const dynamic = "force-dynamic";

export default async function MobileDashboardPage() {
    // Desativa cache para garantir dados sempre atualizados no fetch SSR
    noStore();

    let data;
    try {
        // Busca os mesmos dados da TV, mas passaremos para o componente mobile
        data = await getTVDashboardData();
    } catch (err) {
        console.error("Erro ao carregar dados do Dashboard Mobile:", err);
        throw err;
    }

    return (
        <main className="min-h-screen w-full overflow-x-hidden bg-white">
            <MobileDashboardClient data={data} />
        </main>
    );
}
