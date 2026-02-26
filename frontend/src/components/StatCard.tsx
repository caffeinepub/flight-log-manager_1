import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  accent?: boolean;
}

export default function StatCard({ title, value, subtitle, icon: Icon, accent }: StatCardProps) {
  return (
    <Card className={`bg-card border-border ${accent ? 'border-primary/40' : ''}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
            <p className="font-display text-3xl font-bold text-foreground leading-none">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1.5">{subtitle}</p>
            )}
          </div>
          <div className={`p-2.5 rounded-lg ${accent ? 'bg-primary/20' : 'bg-secondary'} ml-3 flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
