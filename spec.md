# Specification

## Summary
**Goal:** Fix broken Flight Log and Aircraft functionality so that flight entries and aircraft records can be created, updated, and deleted without errors.

**Planned changes:**
- Fix the LogFlight page form submission to correctly call the backend mutation, persist the flight record, show a success notification, and display inline validation errors
- Fix all action buttons (add, edit, delete, record daily hours) on the ManageAircraft page so mutations are properly wired and the UI updates after each action
- Audit and fix `useQueries.ts` hooks to ensure all flight log and aircraft mutations call the correct backend actor methods, invalidate the appropriate query caches on success, and surface errors to the UI
- Fix backend Motoko actor CRUD operations (`addFlightEntry`, `updateAircraft`, `deleteAircraft`, `recordDailyHours`) to return proper results, handle missing records with descriptive errors, and not silently block authorized users

**User-visible outcome:** Users can successfully log new flight entries, and manage aircraft (add, edit, delete, record daily hours) with the UI reflecting all changes in real time and appropriate success or error feedback shown.
