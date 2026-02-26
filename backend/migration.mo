import Map "mo:core/Map";
import Set "mo:core/Set";
import List "mo:core/List";
import Time "mo:core/Time";

module {
  type FlightEntry = {
    date : Time.Time;
    student : Text;
    instructor : Text;
    aircraft : Text;
    exercise : Text;
    flightType : { #solo; #dual };
    takeoffTime : Text;
    landingTime : Text;
    duration : Nat;
    landingType : { #day; #night };
    landingCount : Nat;
  };

  type HourLogEntry = {
    date : Time.Time;
    hours : Nat;
  };

  type OldEntity = {
    name : Text;
    id : Nat;
  };

  type NewAircraft = {
    id : Nat;
    name : Text;
    totalHours : Nat;
    hourLog : List.List<HourLogEntry>;
  };

  type OldActor = {
    students : Set.Set<OldEntity>;
    instructors : Set.Set<OldEntity>;
    aircraft : Set.Set<OldEntity>;
    exercises : Set.Set<OldEntity>;
    flightEntries : Map.Map<Nat, FlightEntry>;
    nextId : Nat;
  };

  type NewActor = {
    students : Set.Set<OldEntity>;
    instructors : Set.Set<OldEntity>;
    exercises : Set.Set<OldEntity>;
    flightEntries : Map.Map<Nat, FlightEntry>;
    aircraft : Map.Map<Nat, NewAircraft>;
    nextId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    let newAircraft = Map.empty<Nat, NewAircraft>();
    for (entity in old.aircraft.values()) {
      let aircraft = {
        id = entity.id;
        name = entity.name;
        totalHours = 0;
        hourLog = List.empty<HourLogEntry>();
      };
      newAircraft.add(entity.id, aircraft);
    };
    {
      old with
      aircraft = newAircraft;
    };
  };
};
