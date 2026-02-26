# Specification

## Summary
**Goal:** Add aircraft hours tracking to the Flight Log Manager, supporting manual daily hour updates and automatic calculation from flight log entries.

**Planned changes:**
- Extend the Aircraft entity in the backend to store a cumulative total hours field and a daily hour log (array of date + hours pairs).
- Add backend methods to record a daily hour update, retrieve the full daily log, and compute combined total hours (manual entries + flight-log-derived hours) per aircraft.
- Add an "Aircraft Hours" section to the Manage Aircraft page showing each aircraft's total hours, a form to log a daily update (date + hours), and a per-aircraft history table of daily entries sorted by date descending.
- Update the Dashboard's per-aircraft utilization table to display total hours using the combined calculation from both sources.

**User-visible outcome:** Users can log daily aircraft hours on the Manage Aircraft page, view a history of entries per aircraft, and see accurate combined total hours reflected both on the aircraft page and the Dashboard utilization table.
