import Map "mo:core/Map";
import Set "mo:core/Set";
import List "mo:core/List";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";

import Array "mo:core/Array";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  type FlightEntry = {
    date : Time.Time;
    student : Text;
    instructor : Text;
    aircraft : Text;
    exercise : Text;
    flightType : FlightType;
    takeoffTime : Text;
    landingTime : Text;
    duration : Nat;
    landingType : LandingType;
    landingCount : Nat;
  };

  type FlightType = { #solo; #dual };

  type LandingType = { #day; #night };

  type HourLogEntry = {
    date : Time.Time;
    hours : Nat;
  };

  type Aircraft = {
    id : Nat;
    name : Text;
    totalHours : Nat;
    hourLog : [HourLogEntry];
  };

  type AircraftInternal = {
    id : Nat;
    name : Text;
    totalHours : Nat;
    hourLog : List.List<HourLogEntry>;
  };

  type Entity = {
    name : Text;
    id : Nat;
  };

  type AircraftInput = {
    name : Text;
    totalHours : Nat;
  };

  type DashboardStats = {
    dailyTotalFlights : Nat;
    dailyTotalHours : Nat;
    monthlyTotalFlights : Nat;
    monthlyTotalHours : Nat;
    aircraftUtilization : [(Text, Nat)];
    recentFlights : [FlightEntry];
  };

  type UserProfile = {
    name : Text;
    email : Text;
  };

  module Entity {
    public func compare(a : Entity, b : Entity) : Order.Order {
      Text.compare(a.name, b.name);
    };
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let userProfiles = Map.empty<Principal, UserProfile>();

  let students = Set.empty<Entity>();
  let instructors = Set.empty<Entity>();
  let exercises = Set.empty<Entity>();
  let flightEntries = Map.empty<Nat, FlightEntry>();
  let aircraft = Map.empty<Nat, AircraftInternal>();
  var nextId = 0;

  // User profile management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get their user profile");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Entity CRUD - admin only
  public shared ({ caller }) func addEntity(listType : Text, name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add entities");
    };
    let entity : Entity = { name; id = nextId };
    nextId += 1;

    switch (listType) {
      case ("students") { students.add(entity) };
      case ("instructors") { instructors.add(entity) };
      case ("exercises") { exercises.add(entity) };
      case (_) { Runtime.trap("Invalid entity type") };
    };
  };

  public shared ({ caller }) func addFlightEntry(
    date : Time.Time,
    student : Text,
    instructor : Text,
    aircraft : Text,
    exercise : Text,
    flightType : FlightType,
    takeoffTime : Text,
    landingTime : Text,
    duration : Nat,
    landingType : LandingType,
    landingCount : Nat,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can log flights");
    };

    let flightEntry : FlightEntry = {
      date;
      student;
      instructor;
      aircraft;
      exercise;
      flightType;
      takeoffTime;
      landingTime;
      duration;
      landingType;
      landingCount;
    };

    flightEntries.add(nextId, flightEntry);
    let currentId = nextId;
    nextId += 1;
    currentId;
  };

  public shared ({ caller }) func updateAircraft(
    aircraftId : Nat,
    updatedAircraft : AircraftInput,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update aircraft");
    };

    let newAircraft : AircraftInternal = {
      id = aircraftId;
      name = updatedAircraft.name;
      totalHours = updatedAircraft.totalHours;
      hourLog = List.empty<HourLogEntry>();
    };
    // Simply add/update the aircraft entry without assuming it existed
    aircraft.add(aircraftId, newAircraft);
  };

  public shared ({ caller }) func recordDailyHours(aircraftId : Nat, dayHours : Nat, nightHours : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can record daily hours for aircraft");
    };

    let date = Time.now();

    // Create separate entries for day and night
    let dayEntry : HourLogEntry = {
      date;
      hours = dayHours;
    };

    let nightEntry : HourLogEntry = {
      date;
      hours = nightHours;
    };

    // Add both entries to the aircraft log if aircraft exists
    switch (aircraft.get(aircraftId)) {
      case (?existingAircraft) {
        // Add new entries to the front of the log
        let updatedHourLog = List.empty<HourLogEntry>();
        updatedHourLog.add(dayEntry);
        updatedHourLog.add(nightEntry);

        // Add the rest of the entries (up to 3 total)
        let hourArray = existingAircraft.hourLog.toArray();
        if (hourArray.size() > 0) {
          updatedHourLog.add(hourArray[0]);
        };
        let updatedAircraft = {
          existingAircraft with
          totalHours = dayHours + nightHours;
          hourLog = updatedHourLog;
        };
        aircraft.add(aircraftId, updatedAircraft);
      };
      case (null) { Runtime.trap("Aircraft not found") };
    };
  };

  public shared ({ caller }) func deleteAircraft(aircraftId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete aircraft");
    };

    // Check if the aircraft exists before attempting to delete
    switch (aircraft.get(aircraftId)) {
      case (?_) {
        aircraft.remove(aircraftId);
      };
      case (null) { Runtime.trap("Aircraft not found") };
    };
  };

  public shared ({ caller }) func editEntity(listType : Text, id : Nat, newName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can edit entities");
    };
    let entity : Entity = { name = newName; id };

    switch (listType) {
      case ("students") {
        students.remove(entity);
        students.add(entity);
      };
      case ("instructors") {
        instructors.remove(entity);
        instructors.add(entity);
      };
      case ("exercises") {
        exercises.remove(entity);
        exercises.add(entity);
      };
      case (_) { Runtime.trap("Invalid entity type") };
    };
  };

  public shared ({ caller }) func deleteEntity(listType : Text, id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete entities");
    };
    let entities = switch (listType) {
      case ("students") { students };
      case ("instructors") { instructors };
      case ("exercises") { exercises };
      case (_) { Runtime.trap("Invalid entity type") };
    };
    entities.remove({ name = ""; id });
  };

  // Read operations - any authenticated user
  public query ({ caller }) func getEntities(listType : Text) : async [Entity] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view entities");
    };
    let entities = switch (listType) {
      case ("students") { students };
      case ("instructors") { instructors };
      case ("exercises") { exercises };
      case (_) { Runtime.trap("Invalid entity type") };
    };
    entities.toArray();
  };

  public query ({ caller }) func getFlights() : async [FlightEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view flights");
    };
    flightEntries.values().toArray();
  };

  // Empty implementations for dashboard stats and filtering
  public query ({ caller }) func getDashboardStats() : async DashboardStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view dashboard stats");
    };
    let stats : DashboardStats = {
      dailyTotalFlights = 0;
      dailyTotalHours = 0;
      monthlyTotalFlights = 0;
      monthlyTotalHours = 0;
      aircraftUtilization = [];
      recentFlights = [];
    };
    stats;
  };

  public query ({ caller }) func filterFlights(
    month : Text,
    student : Text,
    aircraftFilter : Text,
  ) : async [FlightEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can filter flights");
    };
    let filtered = flightEntries.values().toArray();
    filtered;
  };
};
