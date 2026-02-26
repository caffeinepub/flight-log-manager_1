import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { FlightEntry, UserProfile, Entity, AircraftInput } from '../backend';
import { toast } from 'sonner';

// ─── User Profile ────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export function useGetDashboardStats() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getDashboardStats();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 30_000,
  });
}

// ─── Entities ────────────────────────────────────────────────────────────────

export function useGetEntities(listType: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Entity[]>({
    queryKey: ['entities', listType],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getEntities(listType);
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useAddEntity() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listType, name }: { listType: string; name: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addEntity(listType, name);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['entities', variables.listType] });
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error('Failed to add: ' + msg);
    },
  });
}

export function useEditEntity() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listType, id, newName }: { listType: string; id: bigint; newName: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.editEntity(listType, id, newName);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['entities', variables.listType] });
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error('Failed to update: ' + msg);
    },
  });
}

export function useDeleteEntity() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listType, id }: { listType: string; id: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteEntity(listType, id);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['entities', variables.listType] });
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error('Failed to delete: ' + msg);
    },
  });
}

// ─── Aircraft ─────────────────────────────────────────────────────────────────

export function useDeleteAircraft() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (aircraftId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteAircraft(aircraftId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities', 'aircraft'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Aircraft deleted successfully.');
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error('Failed to delete aircraft: ' + msg);
    },
  });
}

export function useUpdateAircraft() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ aircraftId, input }: { aircraftId: bigint; input: AircraftInput }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateAircraft(aircraftId, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities', 'aircraft'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Aircraft updated successfully.');
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error('Failed to update aircraft: ' + msg);
    },
  });
}

export function useRecordDailyHours() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      aircraftId,
      dayHours,
      nightHours,
    }: {
      aircraftId: bigint;
      dayHours: bigint;
      nightHours: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.recordDailyHours(aircraftId, dayHours, nightHours);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities', 'aircraft'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Hours logged successfully.');
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error('Failed to log hours: ' + msg);
    },
  });
}

// ─── Flights ─────────────────────────────────────────────────────────────────

export function useGetFlights() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<FlightEntry[]>({
    queryKey: ['flights'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getFlights();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useFilterFlights(month: string, student: string, aircraftFilter: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<FlightEntry[]>({
    queryKey: ['flights', 'filter', month, student, aircraftFilter],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.filterFlights(month, student, aircraftFilter);
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useAddFlightEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: FlightEntry) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addFlightEntry(
        entry.date,
        entry.student,
        entry.instructor,
        entry.aircraft,
        entry.exercise,
        entry.flightType,
        entry.takeoffTime,
        entry.landingTime,
        entry.duration,
        entry.landingType,
        entry.landingCount,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flights'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Flight logged successfully!');
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error('Failed to log flight: ' + msg);
    },
  });
}

// ─── Admin check ─────────────────────────────────────────────────────────────

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
  });
}
