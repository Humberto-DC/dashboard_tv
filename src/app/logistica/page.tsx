import { Suspense } from 'react';
import { getLogisticaData } from '@/features/logistica/services/logisticaService';
import { LogisticaLayout } from '@/features/logistica/components/LogisticaLayout';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Logística | Conecta 360',
    description: 'Dashboard administrativo de logística e custos operacionais.',
};

export default async function LogisticaPage() {
    const data = await getLogisticaData();

    return (
        <Suspense fallback={<LogisticaLoading />}>
            <LogisticaLayout initialData={data} />
        </Suspense>
    );
}

function LogisticaLoading() {
    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 font-medium animate-pulse">Carregando dados logísticos...</p>
            </div>
        </div>
    );
}
