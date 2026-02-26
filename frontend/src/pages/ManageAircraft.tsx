import React, { useState } from 'react';
import {
  useGetEntities,
  useAddEntity,
  useEditEntity,
  useDeleteAircraft,
  useRecordDailyHours,
} from '../hooks/useQueries';
import { Entity } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Plane, Plus, Loader2, Pencil, Trash2, Check, X,
  ChevronDown, ChevronUp, PlusCircle, AlertCircle, Moon, Sun,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Add Aircraft Form ────────────────────────────────────────────────────────

function AddAircraftForm() {
  const [newName, setNewName] = useState('');
  const addEntity = useAddEntity();

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    try {
      await addEntity.mutateAsync({ listType: 'aircraft', name: trimmed });
      setNewName('');
      toast.success(`Aircraft "${trimmed}" added successfully.`);
    } catch {
      // error already handled in mutation onError
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        placeholder="Add new aircraft (e.g. ZK-ABC)..."
        className="bg-input border-border text-foreground placeholder:text-muted-foreground"
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        disabled={addEntity.isPending}
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
  aircraftName: string;
  onSuccess: () => void;
}

function DailyHoursForm({ aircraftId, aircraftName, onSuccess }: DailyHoursFormProps) {
  const [dayHours, setDayHours] = useState('');
  const [nightHours, setNightHours] = useState('');
  const [error, setError] = useState('');
  const recordDailyHours = useRecordDailyHours();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const dayNum = parseInt(dayHours || '0', 10);
    const nightNum = parseInt(nightHours || '0', 10);

    if (isNaN(dayNum) || dayNum < 0) {
      setError('Day hours must be 0 or greater.');
      return;
    }
    if (isNaN(nightNum) || nightNum < 0) {
      setError('Night hours must be 0 or greater.');
      return;
    }
    if (dayNum === 0 && nightNum === 0) {
      setError('Please enter at least some day or night hours.');
      return;
    }

    try {
      await recordDailyHours.mutateAsync({
        aircraftId,
        dayHours: BigInt(dayNum),
        nightHours: BigInt(nightNum),
      });
      setDayHours('');
      setNightHours('');
      onSuccess();
    } catch {
      // error already handled in mutation onError
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Sun className="w-3 h-3" /> Day Hours
          </label>
          <Input
            type="number"
            min="0"
            step="1"
            value={dayHours}
            onChange={(e) => setDayHours(e.target.value)}
            placeholder="e.g. 2"
            className="bg-input border-border text-foreground text-sm h-9"
            disabled={recordDailyHours.isPending}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Moon className="w-3 h-3" /> Night Hours
          </label>
          <Input
            type="number"
            min="0"
            step="1"
            value={nightHours}
            onChange={(e) => setNightHours(e.target.value)}
            placeholder="e.g. 1"
            className="bg-input border-border text-foreground text-sm h-9"
            disabled={recordDailyHours.isPending}
          />
        </div>
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}
      <Button
        type="submit"
        disabled={recordDailyHours.isPending || (!dayHours && !nightHours)}
        size="sm"
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {recordDailyHours.isPending ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Saving...</>
        ) : (
          <><PlusCircle className="w-3.5 h-3.5 mr-1.5" />Log Hours for {aircraftName}</>
        )}
      </Button>
    </form>
  );
}

// ─── Aircraft Card ────────────────────────────────────────────────────────────

interface AircraftCardProps {
  aircraft: Entity;
}

function AircraftCard({ aircraft }: AircraftCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(aircraft.name);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const editEntity = useEditEntity();
  const deleteAircraft = useDeleteAircraft();

  const handleEditSave = async () => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    try {
      await editEntity.mutateAsync({ listType: 'aircraft', id: aircraft.id, newName: trimmed });
      setIsEditing(false);
      toast.success(`Aircraft renamed to "${trimmed}".`);
    } catch {
      // error already handled in mutation onError
    }
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditName(aircraft.name);
  };

  const handleDeleteClick = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    setConfirmDelete(false);
    deleteAircraft.mutate(aircraft.id);
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
                  if (e.key === 'Escape') handleEditCancel();
                }}
                autoFocus
                disabled={editEntity.isPending}
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={handleEditSave}
                disabled={editEntity.isPending || !editName.trim()}
                className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10 shrink-0"
                title="Save"
              >
                {editEntity.isPending
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Check className="w-3.5 h-3.5" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleEditCancel}
                disabled={editEntity.isPending}
                className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-foreground truncate block">
                  {aircraft.name}
                </span>
              </div>

              {/* Edit button */}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setEditName(aircraft.name);
                  setIsEditing(true);
                }}
                disabled={deleteAircraft.isPending}
                className="h-8 w-8 text-muted-foreground hover:text-primary shrink-0"
                title="Edit aircraft name"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>

              {/* Delete button — requires double-click confirmation */}
              <Button
                size="icon"
                variant="ghost"
                onClick={handleDeleteClick}
                disabled={deleteAircraft.isPending}
                className={`h-8 w-8 shrink-0 transition-colors ${
                  confirmDelete
                    ? 'text-destructive bg-destructive/10 hover:bg-destructive/20'
                    : 'text-muted-foreground hover:text-destructive'
                }`}
                title={confirmDelete ? 'Click again to confirm delete' : 'Delete aircraft'}
              >
                {deleteAircraft.isPending
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Trash2 className="w-3.5 h-3.5" />}
              </Button>

              {/* Expand toggle */}
              <CollapsibleTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                  title={isOpen ? 'Collapse' : 'Expand to log hours'}
                >
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
            </>
          )}
        </div>

        {/* Confirm delete hint */}
        {confirmDelete && (
          <div className="px-4 pb-2">
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Click the delete button again to confirm removal of "{aircraft.name}".
            </p>
          </div>
        )}

        {/* Expandable section — Daily Hours Form */}
        <CollapsibleContent>
          <div className="border-t border-border/40 px-4 py-4">
            <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">
              Log Daily Hours
            </p>
            <DailyHoursForm
              aircraftId={aircraft.id}
              aircraftName={aircraft.name}
              onSuccess={() => setIsOpen(false)}
            />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ManageAircraft() {
  const { data: aircraftList = [], isLoading, isError, refetch } = useGetEntities('aircraft');

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
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
              <p className="text-sm text-muted-foreground">Failed to load aircraft list.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : aircraftList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No aircraft added yet. Type a name above and click <strong>Add</strong>.
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
        Click the expand arrow on any aircraft to log daily day and night hours.
      </p>
    </div>
  );
}
