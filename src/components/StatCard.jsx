import React from "react";

function StatCard({ icon, label, value, change, index }) {
  return (
    <div
      className="bg-slate-900 border border-slate-800 p-6 rounded-3xl match-item-animate"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-slate-800 rounded-2xl">{icon}</div>
        <span className="text-slate-400 font-medium text-sm">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <h2 className="text-3xl font-black">{value}</h2>
        <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-lg">
          {change}
        </span>
      </div>
    </div>
  );
}

export default StatCard;
