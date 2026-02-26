import React from 'react';
import { FlightEntry, FlightType, LandingType } from '../backend';
import { formatDate, formatDuration } from '../utils/timeUtils';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface FlightRecordsTableProps {
  flights: FlightEntry[];
}

function FlightTypeBadge({ type }: { type: FlightType }) {
  return (
    <Badge
      variant={type === FlightType.solo ? 'default' : 'secondary'}
      className={type === FlightType.solo
        ? 'bg-primary/20 text-primary border-primary/30 text-xs'
        : 'bg-secondary text-secondary-foreground text-xs'
      }
    >
      {type === FlightType.solo ? 'Solo' : 'Dual'}
    </Badge>
  );
}

function LandingTypeBadge({ type }: { type: LandingType }) {
  return (
    <Badge
      variant="outline"
      className={type === LandingType.day
        ? 'border-yellow-500/40 text-yellow-400 text-xs'
        : 'border-blue-500/40 text-blue-400 text-xs'
      }
    >
      {type === LandingType.day ? '☀️ Day' : '🌙 Night'}
    </Badge>
  );
}

export default function FlightRecordsTable({ flights }: FlightRecordsTableProps) {
  if (flights.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <div className="text-4xl mb-3">✈️</div>
        <p className="font-medium">No flight records found</p>
        <p className="text-sm mt-1">Try adjusting your filters or log a new flight</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Date</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Student</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Instructor</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Aircraft</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Exercise</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Type</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Takeoff</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Landing</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Duration</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Landing</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase tracking-wider text-right">Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flights.map((flight, idx) => (
              <TableRow key={idx} className="border-border hover:bg-secondary/30 transition-colors">
                <TableCell className="text-foreground font-medium text-sm">{formatDate(flight.date)}</TableCell>
                <TableCell className="text-foreground text-sm">{flight.student}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{flight.instructor}</TableCell>
                <TableCell className="text-foreground text-sm font-medium">{flight.aircraft}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{flight.exercise}</TableCell>
                <TableCell><FlightTypeBadge type={flight.flightType} /></TableCell>
                <TableCell className="text-muted-foreground text-sm font-mono">{flight.takeoffTime}</TableCell>
                <TableCell className="text-muted-foreground text-sm font-mono">{flight.landingTime}</TableCell>
                <TableCell className="text-primary font-semibold text-sm font-mono">{formatDuration(flight.duration)}</TableCell>
                <TableCell><LandingTypeBadge type={flight.landingType} /></TableCell>
                <TableCell className="text-right text-foreground text-sm">{flight.landingCount.toString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {flights.map((flight, idx) => (
          <div key={idx} className="bg-secondary/30 border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-foreground">{flight.student}</p>
                <p className="text-xs text-muted-foreground">{formatDate(flight.date)}</p>
              </div>
              <div className="flex gap-1.5">
                <FlightTypeBadge type={flight.flightType} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">Instructor</span>
                <p className="text-foreground">{flight.instructor}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Aircraft</span>
                <p className="text-foreground font-medium">{flight.aircraft}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Exercise</span>
                <p className="text-foreground">{flight.exercise}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Duration</span>
                <p className="text-primary font-semibold font-mono">{formatDuration(flight.duration)}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Times</span>
                <p className="text-foreground font-mono text-xs">{flight.takeoffTime} → {flight.landingTime}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Landings</span>
                <div className="flex items-center gap-1.5">
                  <LandingTypeBadge type={flight.landingType} />
                  <span className="text-foreground text-xs">×{flight.landingCount.toString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
