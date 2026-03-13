'use client';

import React from 'react';
import { MaterialMovimentacao } from '../types';
import { getStatusColor } from '../services/logisticaService';
import { motion } from 'framer-motion';
import {
    ArrowUpRight,
    ArrowDownLeft,
    Truck,
    User,
    Calendar,
    Box,
    ChevronRight
} from 'lucide-react';

interface MaterialsSummaryProps {
    data: MaterialMovimentacao[];
}

export const MaterialsSummary: React.FC<MaterialsSummaryProps> = ({ data }) => {
    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-sm overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white">Fluxo de Materiais</h3>
                    <p className="text-slate-400 text-sm">Resumo de entradas e saídas (Estoque)</p>
                </div>
                <div className="flex space-x-2">
                    <div className="flex items-center text-xs text-slate-400 space-x-1 px-3 py-1 bg-slate-800/50 rounded-full border border-slate-700">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Entrada</span>
                    </div>
                    <div className="flex items-center text-xs text-slate-400 space-x-1 px-3 py-1 bg-slate-800/50 rounded-full border border-slate-700">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <span>Saída</span>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-800/30 text-slate-400 text-xs font-medium uppercase tracking-wider">
                            <th className="px-6 py-4">Item</th>
                            <th className="px-6 py-4">Direção</th>
                            <th className="px-6 py-4">Método</th>
                            <th className="px-6 py-4">Entidade</th>
                            <th className="px-6 py-4">Previsto</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {data.map((item, index) => (
                            <motion.tr
                                key={item.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="hover:bg-slate-800/50 transition-colors group"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-slate-800 rounded-lg group-hover:scale-110 transition-transform">
                                            <Box className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-white">{item.material}</div>
                                            <div className="text-xs text-slate-500">{item.quantidade} {item.unidade}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium">
                                    {item.direcao === 'entrada' ? (
                                        <div className="flex items-center text-emerald-500 px-2 py-1 rounded bg-emerald-500/10 w-fit">
                                            <ArrowDownLeft className="w-3 h-3 mr-1" />
                                            Entrada
                                        </div>
                                    ) : (
                                        <div className="flex items-center text-amber-500 px-2 py-1 rounded bg-amber-500/10 w-fit">
                                            <ArrowUpRight className="w-3 h-3 mr-1" />
                                            Saída
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center text-xs text-slate-400">
                                        {item.metodo === 'transportadora' ? (
                                            <><Truck className="w-3 h-3 mr-1 text-slate-500" /> Transportadora</>
                                        ) : (
                                            <><User className="w-3 h-3 mr-1 text-slate-500" /> Retirada</>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-300">
                                    {item.entidade}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center text-xs text-slate-400">
                                        <Calendar className="w-3 h-3 mr-1 text-slate-500" />
                                        {new Date(item.dataPrevista).toLocaleDateString('pt-BR')}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${getStatusColor(item.status)}`}>
                                        {item.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-500 group-hover:text-white">
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
