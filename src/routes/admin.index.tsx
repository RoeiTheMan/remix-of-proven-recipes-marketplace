import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getDashboardStats, generateDemoCatalog } from "@/services/adminService";
import { useAuth } from "@/context/AuthContext";
import { StatCard } from "@/components/StatCard";
import { AdminChartCard } from "@/components/AdminChartCard";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/admin/")({ component: AdminOverview });

const CHART_COLORS = ["oklch(0.18 0 0)", "oklch(0.50 0.055 195)", "oklch(0.48 0.20 265)", "oklch(0.62 0 0)", "oklch(0.72 0.10 60)"];

function AdminOverview() {
  const { isAdmin, isCreator } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-stats"], queryFn: getDashboardStats });
  const gen = useMutation({
    mutationFn: generateDemoCatalog,
    onSuccess: (res) => {
      toast.success(`Demo catalog: ${res.created} created, ${res.skipped} already existed`);
      qc.invalidateQueries();
    },
    onError: (err: Error) => {
      const msg = err.message.includes("admin_must_be_creator")
        ? "You must also have a creator profile to generate demo listings under your account."
        : err.message;
      toast.error(msg);
    },
  });
  if (!data) return <p className="text-neutral-gray">Loading…</p>;

  return (
    <div className="space-y-8">
      <div>
        <span className="label-eyebrow">Overview</span>
        <h1 className="font-display text-4xl mt-2">Marketplace health</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active creators" value={data.activeCreators} />
        <StatCard label="Active buyers" value={data.activeBuyers} />
        <StatCard label="GMV" value={`$${(data.gmvCents / 100).toFixed(0)}`} accent="signal" />
        <StatCard label="Transactions" value={data.transactions} />
        <StatCard label="Pending reviews" value={data.pendingReviews} />
        <StatCard label="Approval rate" value={`${data.approvalRate}%`} accent="teal" />
        <StatCard label="Dispute rate" value={`${data.disputeRate}%`} />
        <StatCard label="Avg consistency" value={data.avgConsistency} accent="teal" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <AdminChartCard title="Sales over time (14 days)">
          <ResponsiveContainer>
            <LineChart data={data.salesOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.85 0.005 85)" />
              <XAxis dataKey="day" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </AdminChartCard>

        <AdminChartCard title="Listings by model">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data.listingsByModel} dataKey="count" nameKey="model" innerRadius={50} outerRadius={90}>
                {data.listingsByModel.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </AdminChartCard>

        <AdminChartCard title="Rating distribution">
          <ResponsiveContainer>
            <BarChart data={data.ratingDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.85 0.005 85)" />
              <XAxis dataKey="star" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Bar dataKey="count" fill={CHART_COLORS[1]} />
            </BarChart>
          </ResponsiveContainer>
        </AdminChartCard>

        <AdminChartCard title="Transaction statuses">
          <ResponsiveContainer>
            <BarChart data={data.txStatuses} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.85 0.005 85)" />
              <XAxis type="number" fontSize={11} />
              <YAxis type="category" dataKey="status" fontSize={11} width={80} />
              <Tooltip />
              <Bar dataKey="count" fill={CHART_COLORS[2]} />
            </BarChart>
          </ResponsiveContainer>
        </AdminChartCard>
      </div>

      <div className="border border-ink p-6">
        <span className="label-eyebrow">Marketplace health score</span>
        <div className="font-display text-6xl mt-2">{data.healthScore}<span className="text-2xl text-neutral-gray">/100</span></div>
      </div>
    </div>
  );
}
