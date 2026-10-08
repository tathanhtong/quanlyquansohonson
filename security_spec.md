# Security Specification & Threat Model

## 1. Data Invariants
- All collection reads and writes require an authenticated user (`request.auth != null`).
- Unauthenticated access is strictly forbidden (`match /{document=**} { allow read, write: if false; }`).
- Records must have a valid document ID string meeting length and character constraints.
- Admin user: `tathanhtong@gmail.com` has administrator privileges.
- Audit logs are append-only by authenticated users and cannot be updated or tampered with.
- Soldiers, Commendations, Reprimands, Rewards, Leaves require valid schema fields and proper types.

## 2. The Dirty Dozen Payloads (Rejection Matrix)
1. **Unauthenticated Read**: Attempting to read `/soldiers` without auth token -> PERMISSION_DENIED.
2. **Unauthenticated Write**: Attempting to write `/commendations/com-1` without auth token -> PERMISSION_DENIED.
3. **Ghost Field Injection**: Attempting to create a Soldier with invalid property `isAdmin: true` -> PERMISSION_DENIED.
4. **Invalid Document ID**: Attempting to create doc with malicious ID `../../../etc/passwd` -> PERMISSION_DENIED.
5. **Oversized String Payload**: Attempting to inject a 10MB string into notes -> PERMISSION_DENIED.
6. **Audit Log Tampering**: Attempting to modify existing audit log document -> PERMISSION_DENIED.
7. **Negative Week Number**: Commendation weekNumber < 1 or > 5 -> PERMISSION_DENIED.
8. **Invalid Month Number**: Month < 1 or > 12 -> PERMISSION_DENIED.
9. **Missing Required Fields**: Creating soldier without `fullName` -> PERMISSION_DENIED.
10. **Arbitrary Collection Write**: Attempting to write to `/unregistered_collection/test` -> PERMISSION_DENIED.
11. **Type Spoofing**: Supplying a boolean for `fullName` -> PERMISSION_DENIED.
12. **Audit Log Deletion**: Attempting to delete from `/auditLogs` by non-admin -> PERMISSION_DENIED.
