"use client";

import { useEffect, useState } from "react";
import { 
  Building, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle,
  Loader2
} from "lucide-react";

// Types derived from snapshot 0008 schema
type RequestStatus = "pending" | "approved" | "rejected" | "onboarded";
type TenantPlan = "pilot" | "starter" | "professional" | "scale" | "enterprise";

interface ClientRequest {
  id: number;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  requestedPlan: TenantPlan;
  status: RequestStatus;
  createdAt: string;
}

const statusColors: Record<RequestStatus, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  approved: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  onboarded: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-600 border-red-500/20",
};

const StatusIcon = ({ status }: { status: RequestStatus }) => {
  switch (status) {
    case "pending": return <Clock className="w-4 h-4 mr-1.5" />;
    case "approved": return <CheckCircle className="w-4 h-4 mr-1.5" />;
    case "onboarded": return <CheckCircle className="w-4 h-4 mr-1.5" />;
    case "rejected": return <XCircle className="w-4 h-4 mr-1.5" />;
  }
};

export default function RequestsDashboard() {
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch("/api/requests");
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        if (json) setRequests(json);
      } catch (error) {
        console.error("[FETCH_REQUESTS_ERROR]", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, []);

  // PATCH Route Integration
  const handleStatusChange = async (id: number, newStatus: RequestStatus) => {
    setUpdatingId(id);
    
    // Optimistic UI Update
    setRequests(prev => 
      prev.map(req => req.id === id ? { ...req, status: newStatus } : req)
    );

    try {
      const res = await fetch("/api/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }
    } catch (error) {
      console.error("[PATCH_REQUEST_ERROR]", error);
      // Revert Optimistic Update on failure
      const res = await fetch("/api/requests");
      const json = await res.json();
      setRequests(json);
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center text-sm text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading workspace requests...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Intake Pipeline</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and provision incoming client requests for your subsidiary.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">Company & Contact</th>
                <th className="px-6 py-4">Requested Plan</th>
                <th className="px-6 py-4">Date Received</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No client requests found in this workspace.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 flex items-center">
                        <Building className="w-4 h-4 mr-2 text-slate-400" />
                        {req.companyName}
                      </div>
                      <div className="text-slate-500 mt-1 flex items-center space-x-3">
                        <span className="flex items-center"><Mail className="w-3.5 h-3.5 mr-1" /> {req.contactEmail}</span>
                        {req.contactPhone && <span className="flex items-center"><Phone className="w-3.5 h-3.5 mr-1" /> {req.contactPhone}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium text-xs uppercase tracking-wider">
                        {req.requestedPlan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium ${statusColors[req.status]}`}>
                        {updatingId === req.id ? (
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                        ) : (
                          <StatusIcon status={req.status} />
                        )}
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <select
                        value={req.status}
                        onChange={(e) => handleStatusChange(req.id, e.target.value as RequestStatus)}
                        disabled={updatingId === req.id}
                        className="text-sm border-slate-200 rounded-md shadow-sm focus:ring-bnlv-navy focus:border-bnlv-navy disabled:opacity-50"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approve</option>
                        <option value="onboarded">Mark Onboarded</option>
                        <option value="rejected">Reject</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}