import { FlightEntry, FlightType, LandingType } from '../backend';
import { formatDate, formatDuration } from './timeUtils';

const CSV_HEADERS = [
  'Date', 'Student', 'Instructor', 'Aircraft', 'Type', 'Exercise',
  'Takeoff', 'Landing', 'Total', 'LandingType', 'LandingCount'
];

function flightTypeLabel(ft: FlightType): string {
  return ft === FlightType.solo ? 'Solo' : 'Dual';
}

function landingTypeLabel(lt: LandingType): string {
  return lt === LandingType.day ? 'Day' : 'Night';
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportFlightsToCsv(flights: FlightEntry[], filename?: string): void {
  const rows: string[][] = [CSV_HEADERS];

  for (const f of flights) {
    rows.push([
      formatDate(f.date),
      f.student,
      f.instructor,
      f.aircraft,
      flightTypeLabel(f.flightType),
      f.exercise,
      f.takeoffTime,
      f.landingTime,
      formatDuration(f.duration),
      landingTypeLabel(f.landingType),
      f.landingCount.toString(),
    ]);
  }

  const csvContent = rows
    .map(row => row.map(escapeCsvField).join(','))
    .join('\r\n');

  // Add BOM for Excel UTF-8 compatibility
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `flight-log-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
