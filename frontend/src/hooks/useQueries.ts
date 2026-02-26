import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { FlightEntry, UserProfile, Entity, Aircraft } from '../backend';

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
      // Also refresh aircraft list if adding aircraft
      if (variables.listType === 'aircraft') {
        queryClient.invalidateQueries({ queryKey: ['aircraftList'] });
      }
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
      if (variables.listType === 'aircraft') {
        queryClient.invalidateQueries({ queryKey: ['aircraftList'] });
      }
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
      if (variables.listType === 'aircraft') {
        queryClient.invalidateQueries({ queryKey: ['aircraftList'] });
      }
    },
  });
}

// ─── Aircraft ─────────────────────────────────────────────────────────────────

export function useGetAircraftList() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Aircraft[]>({
    queryKey: ['aircraftList'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAircraftList();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useRecordAircraftHours() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      aircraftId,
      date,
      hours,
    }: {
      aircraftId: bigint;
      date: bigint;
      hours: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.recordAircraftHours(aircraftId, date, hours);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aircraftList'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
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

export function useLogFlight() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: FlightEntry) => {
      if (!actor) throw new Error('Actor not available');
      return actor.logFlight(entry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flights'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
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
