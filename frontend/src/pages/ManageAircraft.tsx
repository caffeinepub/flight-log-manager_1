import React, { useState } from 'react';
import { useGetAircraftList, useAddEntity, useEditEntity, useDeleteEntity, useRecordAircraftHours } from '../hooks/useQueries';
import { Aircraft } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Plane, Plus, Loader2, Pencil, Trash2, Check, X,
  ChevronDown, ChevronUp, Clock, PlusCircle, History
} from 'lucide-react';
import { dateToNanoseconds, formatDate } from '../utils/timeUtils';

// ─── Add Aircraft Form ────────────────────────────────────────────────────────

function AddAircraftForm() {
  const [newName, setNewName] = useState('');
  const addEntity = useAddEntity();

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await addEntity.mutateAsync({ listType: 'aircraft', name: newName.trim() });
    setNewName('');
  };

  return (
    <div className="flex gap-2">
      <Input
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        placeholder="Add new aircraft..."
        className="bg-input border-border text-foreground placeholder:text-muted-foreground"
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
      />
      <Button
        onClick={handleAdd}
        disabled={addEntity.isPending || !newName.trim()}
        className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
      >
        {addEntity.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
        <span className="ml-1 hidden sm:inline">Add</span>
      </Button>
    </div>
  );
}

// ─── Daily Hours Form ─────────────────────────────────────────────────────────

interface DailyHoursFormProps {
  aircraftId: bigint;
  onSuccess: () => void;
}

function DailyHoursForm({ aircraftId, onSuccess }: DailyHoursFormProps) {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [hours, setHours] = useState('');
  const [error, setError] = useState('');
  const recordHours = useRecordAircraftHours();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const hoursNum = parseFloat(hours);
    if (!date) { setError('Please select a date.'); return; }
    if (isNaN(hoursNum) || hoursNum <= 0) { setError('Please enter a valid hours value greater than 0.'); return; }

    // Convert hours (decimal) to whole hours bigint for backend
    // The backend stores hours as Nat (whole number), so we round to nearest integer
    const hoursInt = Math.round(hoursNum);
    if (hoursInt <= 0) { setError('Hours must be at least 1.'); return; }

    const dateObj = new Date(date + 'T00:00:00');
    const dateNs = dateToNanoseconds(dateObj);

    await recordHours.mutateAsync({
      aircraftId,
      date: dateNs,
      hours: BigInt(hoursInt),
    });

    setHours('');
    setDate(today);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Date</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-input border-border text-foreground text-sm h-9"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Hours</label>
          <Input
            type="number"
            min="1"
            step="1"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="e.g. 2"
            className="bg-input border-border text-foreground text-sm h-9"
          />
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button
        type="submit"
        disabled={recordHours.isPending || !hours || !date}
        size="sm"
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {recordHours.isPending ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Saving...</>
        ) : (
          <><PlusCircle className="w-3.5 h-3.5 mr-1.5" />Log Hours</>
        )}
      </Button>
    </form>
  );
}

// ─── Hour Log History ─────────────────────────────────────────────────────────

interface HourLogHistoryProps {
  aircraft: Aircraft;
}

function HourLogHistory({ aircraft }: HourLogHistoryProps) {
  const sorted = [...aircraft.hourLog].sort((a, b) => {
    if (b.date > a.date) return 1;
    if (b.date < a.date) return -1;
    return 0;
  });

  if (sorted.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-3">
        No hour entries logged yet.
      </p>
    );
  }

  return (
    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
      {sorted.map((entry, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between px-3 py-1.5 rounded-md bg-secondary/40 border border-border/30"
        >
          <span className="text-xs text-muted-foreground">{formatDate(entry.date)}</span>
          <span className="text-xs font-mono font-semibold text-primary">
            +{Number(entry.hours)}h
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Aircraft Card ────────────────────────────────────────────────────────────

interface AircraftCardProps {
  aircraft: Aircraft;
}

function AircraftCard({ aircraft }: AircraftCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(aircraft.name);
  const [activeTab, setActiveTab] = useState<'log' | 'history'>('log');

  const editEntity = useEditEntity();
  const deleteEntity = useDeleteEntity();

  const handleEditSave = async () => {
    if (!editName.trim()) return;
    await editEntity.mutateAsync({ listType: 'aircraft', id: aircraft.id, newName: editName.trim() });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await deleteEntity.mutateAsync({ listType: 'aircraft', id: aircraft.id });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-xl border border-border/60 bg-secondary/30 overflow-hidden">
        {/* Aircraft header row */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="p-1.5 rounded-md bg-primary/15 shrink-0">
            <Plane className="w-4 h-4 text-primary" />
          </div>

          {isEditing ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 h-8 bg-input border-border text-foreground text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEditSave();
                  if (e.key === 'Escape') { setIsEditing(false); setEditName(aircraft.name); }
                }}
                autoFocus
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={handleEditSave}
                disabled={editEntity.isPending}
                className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10 shrink-0"
              >
                {editEntity.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => { setIsEditing(false); setEditName(aircraft.name); }}
                className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-foreground">{aircraft.name}</span>
              </div>

              {/* Total hours badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 shrink-0">
                <Clock className="w-3 h-3 text-primary" />
                <span className="text-xs font-mono font-bold text-primary">
                  {Number(aircraft.totalHours)}h total
                </span>
              </div>

              {/* Action buttons */}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => { setIsEditing(true); setEditName(aircraft.name); }}
                className="h-8 w-8 text-muted-foreground hover:text-primary shrink-0"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleDelete}
                disabled={deleteEntity.isPending}
                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
              >
                {deleteEntity.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </Button>

              {/* Expand toggle */}
              <CollapsibleTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                >
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
            </>
          )}
        </div>

        {/* Expandable section */}
        <CollapsibleContent>
          <div className="border-t border-border/40 px-4 py-4 space-y-4">
            {/* Tab switcher */}
            <div className="flex gap-1 p-1 rounded-lg bg-secondary/60 w-fit">
              <button
                onClick={() => setActiveTab('log')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'log'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <PlusCircle className="w-3 h-3" />
                Log Hours
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <History className="w-3 h-3" />
                History
                {aircraft.hourLog.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-xs">
                    {aircraft.hourLog.length}
                  </span>
                )}
              </button>
            </div>

            {activeTab === 'log' ? (
              <DailyHoursForm
                aircraftId={aircraft.id}
                onSuccess={() => setActiveTab('history')}
              />
            ) : (
              <HourLogHistory aircraft={aircraft} />
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ManageAircraft() {
  const { data: aircraftList = [], isLoading } = useGetAircraftList();

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/20">
          <Plane className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Aircraft</h1>
          <p className="text-sm text-muted-foreground">Manage fleet and track aircraft hours</p>
        </div>
      </div>

      {/* Main card */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="font-display flex items-center gap-2 text-lg">
            <div className="p-1.5 rounded-md bg-primary/20">
              <Plane className="w-4 h-4 text-primary" />
            </div>
            Aircraft Fleet
            <span className="ml-auto text-sm font-normal text-muted-foreground">
              {aircraftList.length} {aircraftList.length === 1 ? 'aircraft' : 'aircraft'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new aircraft */}
          <AddAircraftForm />

          {/* Aircraft list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : aircraftList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No aircraft added yet. Add one above.
            </div>
          ) : (
            <div className="space-y-2">
              {aircraftList.map((ac) => (
                <AircraftCard key={ac.id.toString()} aircraft={ac} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info note */}
      <p className="text-xs text-muted-foreground text-center px-4">
        Click the expand arrow on any aircraft to log daily hour updates or view the full hours history.
      </p>
    </div>
  );
}
