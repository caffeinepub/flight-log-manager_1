import React from 'react';
import { useGetFlights, useGetAircraftList } from '../hooks/useQueries';
import StatCard from '../components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LayoutDashboard, PlaneTakeoff, Clock, Calendar, Plane, History
} from 'lucide-react';
import { formatDate, formatDuration, formatHoursFromMinutes } from '../utils/timeUtils';
import { FlightEntry, FlightType, Aircraft } from '../backend';

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl bg-secondary" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-xl bg-secondary" />
        <Skeleton className="h-64 rounded-xl bg-secondary" />
      </div>
    </div>
  );
}

// Client-side dashboard computation from raw flights
function computeFlightStats(flights: FlightEntry[]) {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const monthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

  let dailyFlights = 0;
  let dailyMinutes = 0;
  let monthlyFlights = 0;
  let monthlyMinutes = 0;
  // flight-log minutes per aircraft name
  const flightMinutesMap = new Map<string, number>();

  for (const f of flights) {
    const dateMs = Number(f.date / BigInt(1_000_000));
    const dateObj = new Date(dateMs);
    const dateStr = dateObj.toISOString().split('T')[0];
    const monthOfFlight = dateStr.substring(0, 7);
    const dur = Number(f.duration);

    if (dateStr === todayStr) {
      dailyFlights++;
      dailyMinutes += dur;
    }
    if (monthOfFlight === monthStr) {
      monthlyFlights++;
      monthlyMinutes += dur;
    }

    const prev = flightMinutesMap.get(f.aircraft) || 0;
    flightMinutesMap.set(f.aircraft, prev + dur);
  }

  const recentFlights = [...flights]
    .sort((a, b) => Number(b.date - a.date))
    .slice(0, 8);

  return {
    dailyFlights,
    dailyMinutes: BigInt(dailyMinutes),
    monthlyFlights,
    monthlyMinutes: BigInt(monthlyMinutes),
    flightMinutesMap,
    recentFlights,
  };
}

// Combine flight-log minutes with manual aircraft hour entries
function computeAircraftUtilization(
  flightMinutesMap: Map<string, number>,
  aircraftList: Aircraft[]
): Array<[string, number]> {
  // Build a map of aircraft name -> total hours from manual entries (in minutes)
  const manualMinutesMap = new Map<string, number>();
  for (const ac of aircraftList) {
    const manualHours = Number(ac.totalHours);
    manualMinutesMap.set(ac.name, manualHours * 60);
  }

  // Merge: all aircraft names from both sources
  const allNames = new Set<string>([
    ...flightMinutesMap.keys(),
    ...manualMinutesMap.keys(),
  ]);

  const result: Array<[string, number]> = [];
  for (const name of allNames) {
    const flightMins = flightMinutesMap.get(name) || 0;
    const manualMins = manualMinutesMap.get(name) || 0;
    result.push([name, flightMins + manualMins]);
  }

  return result.sort((a, b) => b[1] - a[1]);
}

export default function Dashboard() {
  const { data: flights, isLoading: flightsLoading, isError: flightsError } = useGetFlights();
  const { data: aircraftList = [], isLoading: aircraftLoading } = useGetAircraftList();

  const isLoading = flightsLoading || aircraftLoading;

  if (isLoading) return <DashboardSkeleton />;

  if (flightsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Failed to load dashboard data. Please try again.</p>
      </div>
    );
  }

  const allFlights = flights || [];
  const stats = computeFlightStats(allFlights);
  const aircraftUtilization = computeAircraftUtilization(stats.flightMinutesMap, aircraftList);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/20">
          <LayoutDashboard className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of flight operations</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Flights"
          value={stats.dailyFlights}
          subtitle="flights logged today"
          icon={PlaneTakeoff}
          accent
        />
        <StatCard
          title="Today's Hours"
          value={formatHoursFromMinutes(stats.dailyMinutes)}
          subtitle="total airtime today"
          icon={Clock}
          accent
        />
        <StatCard
          title="Monthly Flights"
          value={stats.monthlyFlights}
          subtitle="flights this month"
          icon={Calendar}
        />
        <StatCard
          title="Monthly Hours"
          value={formatHoursFromMinutes(stats.monthlyMinutes)}
          subtitle="total airtime this month"
          icon={Clock}
        />
      </div>

      {/* Aircraft utilization + Recent flights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Aircraft Utilization */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <Plane className="w-4 h-4 text-primary" />
              Aircraft Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aircraftUtilization.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">No aircraft data yet</p>
            ) : (
              <div className="space-y-3">
                {aircraftUtilization.map(([aircraft, minutes]) => {
                  const maxMinutes = aircraftUtilization[0][1];
                  const pct = maxMinutes > 0 ? (minutes / maxMinutes) * 100 : 0;
                  // Convert minutes to hours for display
                  const totalHours = Math.floor(minutes / 60);
                  const remainingMins = minutes % 60;
                  const hoursLabel = remainingMins > 0
                    ? `${totalHours}h ${remainingMins}m`
                    : `${totalHours}h`;
                  return (
                    <div key={aircraft}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{aircraft}</span>
                        <span className="text-sm font-mono text-primary font-semibold">
                          {hoursLabel}
                        </span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Flights */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <History className="w-4 h-4 text-primary" />
              Recent Flights
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentFlights.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">No flights logged yet</p>
            ) : (
              <div className="space-y-2">
                {stats.recentFlights.map((flight, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40 border border-border/40"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">{flight.student}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {flight.flightType === FlightType.solo ? '• Solo' : '• Dual'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{flight.aircraft}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{formatDate(flight.date)}</span>
                      </div>
                    </div>
                    <span className="text-sm font-mono font-semibold text-primary ml-3 shrink-0">
                      {formatDuration(flight.duration)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
