# Security Specification

## Data Invariants
1. `exercise_logs` documents must always be tied to a `userId` that perfectly matches `request.auth.uid`.
2. `createdAt` must exactly match the server timestamp (`request.time`) on creation, and remains permanently immutable.
3. Users can only create or list logs that belong to them. Updates or deletions are allowed only by the owner and restricted by type validation constraints.
4. Payload sizes for string types must be explicitly constrained to avoid DoS (Denial of Wallet). For example, `exerciseType` and `exerciseName` and `date` must be under reasonable lengths.

## The "Dirty Dozen" Payloads
1. **Creation with spoofed userId**: Creating a log passing in `"spoofed-id"` for `userId`.
2. **Missing auth token**: Attempting to read or write globally without being signed in.
3. **Array injection**: Pushing a massive array into `exerciseName` to bypass type checks or bloat storage.
4. **Giant string injection**: Dropping 1MB string into `exerciseName`.
5. **Ghost field injection**: Including `isAdmin: true` inside the payload.
6. **Date format poisoning**: Malformed date string instead of standard YYYY-MM-DD.
7. **Negative reps/weight**: `warmup1Weight: -100` instead of a valid number (though optional in security rules, good practice to limit if possible).
8. **Changing ownership**: Attempting to modify `userId` of an existing log from the rightful owner's UID to another user's UID.
9. **Creation with missing timestamp**: Dropping `createdAt` entirely, breaking the blueprint strict matching.
10. **Client-side query without bounds**: `where()` clause omitted, returning items belonging to multiple users (should fail the `allow list` condition).
11. **Spoofed unverified email**: Assuming an email without `email_verified: true`.
12. **Modifying an immortal field**: Sending an update operation to change `createdAt`.

## Test Runner (Not directly runnable without Local Emulator)
```typescript
// testrunner
```
