import React, { useState } from 'react';
import { Entity } from '../backend';
import { useAddEntity, useEditEntity, useDeleteEntity } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Trash2, Plus, Loader2, Check, X } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface EntityManagerProps {
  listType: string;
  title: string;
  icon: LucideIcon;
  entities: Entity[];
  isLoading: boolean;
}

export default function EntityManager({ listType, title, icon: Icon, entities, isLoading }: EntityManagerProps) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [editingName, setEditingName] = useState('');

  const addEntity = useAddEntity();
  const editEntity = useEditEntity();
  const deleteEntity = useDeleteEntity();

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await addEntity.mutateAsync({ listType, name: newName.trim() });
    setNewName('');
  };

  const handleEditStart = (entity: Entity) => {
    setEditingId(entity.id);
    setEditingName(entity.name);
  };

  const handleEditSave = async () => {
    if (editingId === null || !editingName.trim()) return;
    await editEntity.mutateAsync({ listType, id: editingId, newName: editingName.trim() });
    setEditingId(null);
    setEditingName('');
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleDelete = async (id: bigint) => {
    await deleteEntity.mutateAsync({ listType, id });
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="font-display flex items-center gap-2 text-lg">
          <div className="p-1.5 rounded-md bg-primary/20">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          {title}
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            {entities.length} {entities.length === 1 ? 'entry' : 'entries'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new */}
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={`Add new ${title.toLowerCase().replace(/s$/, '')}...`}
            className="bg-input border-border text-foreground placeholder:text-muted-foreground"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button
            onClick={handleAdd}
            disabled={addEntity.isPending || !newName.trim()}
            size="default"
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

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : entities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No {title.toLowerCase()} added yet. Add one above.
          </div>
        ) : (
          <div className="space-y-1.5">
            {entities.map((entity) => (
              <div
                key={entity.id.toString()}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50 border border-border/50 group"
              >
                {editingId === entity.id ? (
                  <>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 h-8 bg-input border-border text-foreground text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEditSave();
                        if (e.key === 'Escape') handleEditCancel();
                      }}
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleEditSave}
                      disabled={editEntity.isPending}
                      className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                    >
                      {editEntity.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleEditCancel}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-foreground font-medium">{entity.name}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEditStart(entity)}
                      className="h-8 w-8 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(entity.id)}
                      disabled={deleteEntity.isPending}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {deleteEntity.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
