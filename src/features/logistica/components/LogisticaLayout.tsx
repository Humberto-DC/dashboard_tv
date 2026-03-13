'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CostsDashboard } from './CostsDashboard';
import { MaterialsSummary } from './MaterialsSummary';
import { LogisticaSummary } from '../types';
import { LayoutDashboard, Package, Truck, Receipt } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LogisticaLayoutProps {
    initialData: LogisticaSummary;
}

export const LogisticaLayout: React.FC<LogisticaLayoutProps> = ({ initialData }) => {
    const [activeTab, setActiveTab] = useState<'costs' | 'materials'>('costs');
    const router = useRouter();

    useEffect(() => {
        const interval = setInterval(() => {
            router.refresh(); // Atualiza os dados do Server Component (getLogisticaData)
        }, 60000); // 1 minuto

        return () => clearInterval(interval);
    }, [router]);

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 p-6 md:p-10">
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20">
                            <Truck className="w-8 h-8 text-white" />
                        </div>
                        Gestão Logística
                    </h1>
                    <p className="text-slate-400 mt-2 text-lg">Visão geral de custos e fluxos operacionais.</p>
                </div>

                <nav className="flex p-1 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-md">
                    <button
                        onClick={() => setActiveTab('costs')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 ${activeTab === 'costs'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                    >
                        <Receipt className="w-5 h-5" />
                        <span className="font-semibold">Custos</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('materials')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 ${activeTab === 'materials'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                    >
                        <Package className="w-5 h-5" />
                        <span className="font-semibold">Materiais</span>
                    </button>
                </nav>
            </header>

            <main>
                <AnimatePresence mode="wait">
                    {activeTab === 'costs' ? (
                        <motion.div
                            key="costs"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <CostsDashboard data={initialData.custos} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="materials"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <MaterialsSummary data={initialData.movimentacoes} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <footer className="mt-20 pt-10 border-t border-slate-800/50 flex flex-col md:flex-row items-center justify-between text-slate-500 text-sm gap-4">
                <p>© 2024 Conecta 360 - Dashboard Logístico Profissional</p>
                <div className="flex gap-6">
                    <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Sistema Online
                    </span>
                    <span>Versão 1.2.0</span>
                </div>
            </footer>
        </div>
    );
};
