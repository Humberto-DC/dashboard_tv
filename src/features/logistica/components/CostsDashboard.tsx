'use client';

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie
} from 'recharts';
import { LogisticoCusto } from '../types';
import { formatCurrency } from '../services/logisticaService';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Landmark } from 'lucide-react';

interface CostsDashboardProps {
    data: LogisticoCusto[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];

export const CostsDashboard: React.FC<CostsDashboardProps> = ({ data }) => {
    const total = data.reduce((acc, item) => acc + item.valor, 0);

    // Agrupar por categoria para o gráfico
    const dataByCategory = data.reduce((acc: any[], item) => {
        const existing = acc.find(a => a.name === item.categoria);
        if (existing) {
            existing.value += item.valor;
        } else {
            acc.push({ name: item.categoria, value: item.valor });
        }
        return acc;
    }, []);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 text-sm font-medium">Custo Total</span>
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <DollarSign className="w-5 h-5 text-emerald-500" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-white">{formatCurrency(total)}</h2>
                    <p className="text-emerald-500 text-xs mt-2 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        +12% em relação ao mês anterior
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 text-sm font-medium">Maior Categoria</span>
                        <div className="p-2 bg-sky-500/10 rounded-lg">
                            <Landmark className="w-5 h-5 text-sky-500" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white">Fretes</h2>
                    <p className="text-slate-400 text-xs mt-2">Corresponde a 65% do total</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 text-sm font-medium">Eficiência</span>
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-purple-500" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-white">94.2%</h2>
                    <p className="text-slate-400 text-xs mt-2">Dentro do orçamento previsto</p>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm h-[400px]">
                    <h3 className="text-lg font-semibold text-white mb-6">Distribuição de Custos</h3>
                    <ResponsiveContainer width="100%" height="80%">
                        <BarChart data={dataByCategory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value / 1000}k`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value: number) => formatCurrency(value)}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {dataByCategory.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm h-[400px] flex flex-col items-center">
                    <h3 className="text-lg font-semibold text-white mb-6 self-start">Custos por Fornecedor</h3>
                    <ResponsiveContainer width="100%" height="80%">
                        <PieChart>
                            <Pie
                                data={dataByCategory}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {dataByCategory.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value: number) => formatCurrency(value)}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-4 mt-2 w-full">
                        {dataByCategory.map((item, index) => (
                            <div key={item.name} className="flex items-center space-x-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="text-xs text-slate-400 truncate">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
