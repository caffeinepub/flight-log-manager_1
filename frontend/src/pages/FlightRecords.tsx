import React, { useState } from 'react';
import { useFilterFlights, useGetEntities } from '../hooks/useQueries';
import FlightRecordsTable from '../components/FlightRecordsTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { ClipboardList, Search, RotateCcw, Download, Loader2 } from 'lucide-react';
import { exportFlightsToCsv } from '../utils/csvExport';
import { getCurrentMonthString } from '../utils/timeUtils';

const ALL_VALUE = '__all__';

export default function FlightRecords() {
  const [monthFilter, setMonthFilter] = useState('');
  const [studentFilter, setStudentFilter] = useState(ALL_VALUE);
  const [aircraftFilter, setAircraftFilter] = useState(ALL_VALUE);
  const [activeFilters, setActiveFilters] = useState({
    month: '',
    student: '',
    aircraft: '',
  });

  const { data: students = [] } = useGetEntities('students');
  const { data: aircraft = [] } = useGetEntities('aircraft');

  const { data: flights = [], isLoading, isError } = useFilterFlights(
    activeFilters.month,
    activeFilters.student,
    activeFilters.aircraft,
  );

  const handleSearch = () => {
    setActiveFilters({
      month: monthFilter,
      student: studentFilter === ALL_VALUE ? '' : studentFilter,
      aircraft: aircraftFilter === ALL_VALUE ? '' : aircraftFilter,
    });
  };

  const handleReset = () => {
    setMonthFilter('');
    setStudentFilter(ALL_VALUE);
    setAircraftFilter(ALL_VALUE);
    setActiveFilters({ month: '', student: '', aircraft: '' });
  };

  const handleExport = () => {
    exportFlightsToCsv(flights);
  };

  const hasActiveFilters = activeFilters.month || activeFilters.student || activeFilters.aircraft;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <ClipboardList className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Flight Records</h1>
            <p className="text-sm text-muted-foreground">
              {isLoading ? 'Loading...' : `${flights.length} record${flights.length !== 1 ? 's' : ''} found`}
            </p>
          </div>
        </div>
        <Button
          onClick={handleExport}
          disabled={flights.length === 0 || isLoading}
          variant="outline"
          className="border-primary/40 text-primary hover:bg-primary/10 gap-2"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export CSV</span>
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-sm text-muted-foreground uppercase tracking-wider">
            Filter Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="space-y-1.5">
              <Label className="text-foreground font-medium text-sm">Month</Label>
              <Input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                placeholder="YYYY-MM"
                className="bg-input border-border text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-foreground font-medium text-sm">Student</Label>
              <Select value={studentFilter} onValueChange={setStudentFilter}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder="All students" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value={ALL_VALUE} className="text-popover-foreground">All Students</SelectItem>
                  {students.map(s => (
                    <SelectItem key={s.id.toString()} value={s.name} className="text-popover-foreground">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-foreground font-medium text-sm">Aircraft</Label>
              <Select value={aircraftFilter} onValueChange={setAircraftFilter}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder="All aircraft" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value={ALL_VALUE} className="text-popover-foreground">All Aircraft</SelectItem>
                  {aircraft.map(a => (
                    <SelectItem key={a.id.toString()} value={a.name} className="text-popover-foreground">
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSearch}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            >
              <Search className="w-4 h-4" />
              Search
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="border-border text-foreground hover:bg-secondary gap-2"
              disabled={!hasActiveFilters && !monthFilter && studentFilter === ALL_VALUE && aircraftFilter === ALL_VALUE}
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="bg-card border-border">
        <CardContent className="p-0 pt-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <div className="text-center py-16 text-destructive">
              Failed to load flight records. Please try again.
            </div>
          ) : (
            <div className="px-4 pb-4">
              <FlightRecordsTable flights={flights} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
