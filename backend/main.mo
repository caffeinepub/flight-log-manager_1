import Map "mo:core/Map";
import Set "mo:core/Set";
import List "mo:core/List";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Migration "migration";
import Array "mo:core/Array";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

(with migration = Migration.run)
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
    let newAircraft : AircraftInternal = {
      id = nextId;
      name;
      totalHours = 0;
      hourLog = List.empty<HourLogEntry>();
    };
    nextId += 1;

    switch (listType) {
      case ("students") { students.add(entity) };
      case ("instructors") { instructors.add(entity) };
      case ("exercises") { exercises.add(entity) };
      case ("aircraft") { aircraft.add(nextId, newAircraft) };
      case (_) { Runtime.trap("Invalid entity type") };
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
      case ("aircraft") {
        switch (aircraft.get(id)) {
          case (?existingAircraft) {
            let updatedAircraft = { existingAircraft with name = newName };
            aircraft.add(id, updatedAircraft);
          };
          case (null) { Runtime.trap("Aircraft not found") };
        };
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
      case ("aircraft") { Runtime.trap("Aircraft must be deleted via id") };
      case (_) { Runtime.trap("Invalid entity type") };
    };
    entities.remove({ name = ""; id });
  };

  // Flight logging - any authenticated user
  public shared ({ caller }) func logFlight(entry : FlightEntry) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can log flights");
    };
    flightEntries.add(nextId, entry);
    nextId += 1;
  };

  // Aircraft hour tracking
  public shared ({ caller }) func recordAircraftHours(aircraftId : Nat, date : Time.Time, hours : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can record aircraft hours");
    };
    switch (aircraft.get(aircraftId)) {
      case (?existingAircraft) {
        let newLogEntry : HourLogEntry = { date; hours };

        let updatedHourLog = List.empty<HourLogEntry>();
        updatedHourLog.add(newLogEntry);
        let hourArray = existingAircraft.hourLog.toArray();
        if (hourArray.size() > 0) {
          updatedHourLog.add(hourArray[0]);
          if (hourArray.size() > 1) { updatedHourLog.add(hourArray[1]) };
        };

        let updatedAircraft = {
          existingAircraft with
          totalHours = hours;
          hourLog = updatedHourLog
        };
        aircraft.add(aircraftId, updatedAircraft);
      };
      case (null) { Runtime.trap("Aircraft not found") };
    };
  };

  public query ({ caller }) func getAircraftHourLog(aircraftId : Nat) : async [HourLogEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view aircraft hour log");
    };
    switch (aircraft.get(aircraftId)) {
      case (?existingAircraft) { existingAircraft.hourLog.toArray() };
      case (null) { Runtime.trap("Aircraft not found") };
    };
  };

  public query ({ caller }) func computeRunningTotalHours(aircraftId : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can compute total hours");
    };
    switch (aircraft.get(aircraftId)) {
      case (?_) {};
      case (null) { Runtime.trap("Aircraft not found") };
    };
    0;
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

  public query ({ caller }) func getAircraftList() : async [Aircraft] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view aircraft");
    };
    let aircraftArray = aircraft.toArray();
    aircraftArray.map(func((_, ac)) { { ac with hourLog = ac.hourLog.toArray() } });
  };

  public query ({ caller }) func getFlights() : async [FlightEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view flights");
    };
    flightEntries.values().toArray();
  };

  public query ({ caller }) func getDashboardStats() : async DashboardStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view dashboard stats");
    };
    let today = Time.now();
    let dailyFlights = [] : [FlightEntry];
    let monthlyFlights = [] : [FlightEntry];

    var dailyTotalHours = 0;
    var monthlyTotalHours = 0;

    let dailyTotalFlights = dailyFlights.size();
    let monthlyTotalFlights = monthlyFlights.size();

    let aircraftUtilization = [] : [(Text, Nat)];

    let recentFlights = [] : [FlightEntry];

    {
      dailyTotalFlights;
      dailyTotalHours;
      monthlyTotalFlights;
      monthlyTotalHours;
      aircraftUtilization;
      recentFlights;
    };
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
