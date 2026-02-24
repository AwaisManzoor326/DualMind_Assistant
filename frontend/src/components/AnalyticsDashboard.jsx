import React from "react";
import { X, Activity, Cpu, Zap, Database } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const AnalyticsDashboard = ({ isOpen, onClose, metrics }) => {
  if (!isOpen) return null;

  // Mock data for the chart if real history isn't available
  const data = [
    { name: "Req 1", latency: 120 },
    { name: "Req 2", latency: 300 },
    { name: "Req 3", latency: 250 },
    { name: "Req 4", latency: 180 },
    { name: "Req 5", latency: metrics.latency || 200 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-secondary border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl p-6 m-4 relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Activity className="text-accent" />
          System Analytics
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-muted mb-2 text-xs font-semibold uppercase">
              <Zap size={14} className="text-yellow-400" /> Latency
            </div>
            <div className="text-2xl font-mono text-white">
              {metrics.latency || 0}
              <span className="text-sm text-slate-500 ml-1">ms</span>
            </div>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-muted mb-2 text-xs font-semibold uppercase">
              <Cpu size={14} className="text-blue-400" /> Tokens/Sec
            </div>
            <div className="text-2xl font-mono text-white">
              ~35<span className="text-sm text-slate-500 ml-1">t/s</span>
            </div>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-muted mb-2 text-xs font-semibold uppercase">
              <Database size={14} className="text-emerald-400" /> RAG Context
            </div>
            <div className="text-2xl font-mono text-white">
              {metrics.ragChunks || 0}
              <span className="text-sm text-slate-500 ml-1">chunks</span>
            </div>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-muted mb-2 text-xs font-semibold uppercase">
              <Activity size={14} className="text-purple-400" /> Reliability
            </div>
            <div className="text-2xl font-mono text-white">
              99.9<span className="text-sm text-slate-500 ml-1">%</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full bg-slate-900/30 rounded-xl p-4 border border-slate-800">
          <h3 className="text-sm font-semibold text-muted mb-4">
            Response Latency Trend
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                unit="ms"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  borderColor: "#334155",
                  color: "#f8fafc",
                }}
              />
              <Line
                type="monotone"
                dataKey="latency"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4, fill: "#3b82f6" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
