import { cookies, headers } from "next/headers";
import DashboardClient from "./DashboardClient";

interface DashboardData {
  overview: {
    totalProducts: number;
    lowStockProducts: number;
    todayRevenue: number;
    todaySalesCount: number;
    monthRevenue: number;
  };
  last7Days: { date: string; revenue: number; sales: number }[];
}

async function getDashboardData(): Promise<DashboardData | null> {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) return null;

  const h = await headers();
  const protocol = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return null;

  try {
    const response = await fetch(`${protocol}://${host}/api/reports/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 30 },
    });

    if (!response.ok) return null;
    const json = await response.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  return <DashboardClient data={data} />;
}

