"use client";

// ── Recent Activity Feed ────────────────────────────────────────────
// Shows latest status changes across the system

import { useEffect, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Link from "next/link";
import api from "@/lib/api";

export default function RecentActivity({ limit = 10 }) {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/dashboard/recent-activity?limit=${limit}`)
      .then(({ data }) => setActivity(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [limit]);

  if (loading) return <LoadingSpinner className="py-8" />;

  if (!activity.length) {
    return <p className="text-sm text-gray-400 py-4">No recent activity</p>;
  }

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <ul className="divide-y divide-gray-100">
      {activity.map((item) => (
        <li key={item.id} className="py-2.5 flex items-start gap-3">
          <div className="w-2 h-2 mt-1.5 rounded-full bg-primary-500 shrink-0" />
          <div className="min-w-0 flex-1 text-sm">
            <div className="flex items-center gap-1.5 flex-wrap">
              {item.from_status && (
                <>
                  <StatusBadge status={item.from_status} />
                  <span className="text-gray-400">→</span>
                </>
              )}
              <StatusBadge status={item.to_status} />
            </div>
            <p className="text-gray-600 truncate mt-0.5">
              <Link href={`/admin/applications/${item.application?.id}`}
                className="text-primary-600 hover:underline font-medium">
                {item.application?.reference_number}
              </Link>
              {" "}{item.application?.project_name}
            </p>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
              <span>{item.changedBy?.name || "System"}</span>
              <span>•</span>
              <span>{timeAgo(item.created_at || item.createdAt)}</span>
            </div>
            {item.remarks && (
              <p className="text-xs text-gray-400 mt-0.5 truncate">{item.remarks}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
