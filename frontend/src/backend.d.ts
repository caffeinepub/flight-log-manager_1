import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Aircraft {
    id: bigint;
    totalHours: bigint;
    name: string;
    hourLog: Array<HourLogEntry>;
}
export interface Entity {
    id: bigint;
    name: string;
}
export type Time = bigint;
export interface HourLogEntry {
    hours: bigint;
    date: Time;
}
export interface DashboardStats {
    aircraftUtilization: Array<[string, bigint]>;
    monthlyTotalFlights: bigint;
    dailyTotalHours: bigint;
    monthlyTotalHours: bigint;
    recentFlights: Array<FlightEntry>;
    dailyTotalFlights: bigint;
}
export interface UserProfile {
    name: string;
    email: string;
}
export interface FlightEntry {
    duration: bigint;
    instructor: string;
    date: Time;
    exercise: string;
    flightType: FlightType;
    aircraft: string;
    student: string;
    takeoffTime: string;
    landingTime: string;
    landingType: LandingType;
    landingCount: bigint;
}
export enum FlightType {
    dual = "dual",
    solo = "solo"
}
export enum LandingType {
    day = "day",
    night = "night"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addEntity(listType: string, name: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    computeRunningTotalHours(aircraftId: bigint): Promise<bigint>;
    deleteEntity(listType: string, id: bigint): Promise<void>;
    editEntity(listType: string, id: bigint, newName: string): Promise<void>;
    filterFlights(month: string, student: string, aircraftFilter: string): Promise<Array<FlightEntry>>;
    getAircraftHourLog(aircraftId: bigint): Promise<Array<HourLogEntry>>;
    getAircraftList(): Promise<Array<Aircraft>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDashboardStats(): Promise<DashboardStats>;
    getEntities(listType: string): Promise<Array<Entity>>;
    getFlights(): Promise<Array<FlightEntry>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    logFlight(entry: FlightEntry): Promise<void>;
    recordAircraftHours(aircraftId: bigint, date: Time, hours: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
