"use client";

import { useEffect, useState } from "react";
import { Shield, Activity, AlertTriangle, AlertCircle, Fingerprint, Loader2 } from "lucide-react";

type AuditSeverity = "info" | "warn" | "critical";

interface AuditLog {
  id: number;
  actor: string;
  action: string;
  target: string;
  severity: AuditSeverity;
  ipAddress: string;
  createdAt: string;
}

const severityConfig: Record<AuditSeverity, { icon: React.ElementType, color: string }> = {
  info: { icon: Activity, color: "text-blue-600 bg-blue-50 border-blue-200" },
  warn: { icon: AlertTriangle, color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  critical: { icon: AlertCircle, color: "text-red-600 bg-red-50 border-red-200" },
};

export default function AuditDashboard() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/audit");
        const json = await res.json();
        if (json.data) setLogs(json.data);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (isLoading) {
    return (
      <div className="p-8 flex items-center text-sm text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading compliance trails...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <Shield className="w-6 h-6 text-bnlv-navy" />
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Security & Audit Logs</h1>
          <p className="text-sm text-slate-500">Immutable compliance trail for tenant activity.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-medium">
            <tr>
              <th className="px-6 py-4">Timestamp</th>
              <th className="px-6 py-4">Severity</th>
              <th className="px-6 py-4">Actor & IP</th>
              <th className="px-6 py-4">Action</th>
              <th className="px-6 py-4">Target</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono">
            {logs.map((log) => {
              const { icon: Icon, color } = severityConfig[log.severity];
              return (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md border text-xs font-sans font-medium ${color}`}>
                      <Icon className="w-3.5 h-3.5 mr-1" />
                      {log.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-900">{log.actor}</div>
                    <div className="text-slate-400 text-xs flex items-center mt-1">
                      <Fingerprint className="w-3 h-3 mr-1" /> {log.ipAddress}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-bnlv-navy font-semibold">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 text-slate-600 truncate max-w-xs">
                    {log.target}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}