import React from 'react';
import { useGetEntities } from '../hooks/useQueries';
import EntityManager from '../components/EntityManager';
import { GraduationCap } from 'lucide-react';

export default function ManageStudents() {
  const { data: entities = [], isLoading } = useGetEntities('students');

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/20">
          <GraduationCap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Students</h1>
          <p className="text-sm text-muted-foreground">Manage student roster</p>
        </div>
      </div>
      <EntityManager
        listType="students"
        title="Students"
        icon={GraduationCap}
        entities={entities}
        isLoading={isLoading}
      />
    </div>
  );
}
