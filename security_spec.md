# Security Specification - Bat Quai & Linh Phuong

## 1. Data Invariants
- `access_codes`: 
    - Must be unique (checked by document ID).
    - `code` must match document ID.
    - `active` must be boolean.
    - `uses` must be a non-negative integer.
    - `createdAt` must be a server timestamp.
    - Only admins can read, create, update, or delete.
- `admins`:
    - Only admins (self-lookup) or predefined super-admins can read.
    - System-level read for `isAdmin()` helper.

## 2. Shared Helpers
- `isSignedIn()`: User is authenticated.
- `isEmailVerified()`: User has a verified email.
- `isAdmin()`: User UID exists in `/admins/` collection.
- `isOwner(userId)`: `request.auth.uid == userId`.

## 3. The "Dirty Dozen" Payloads (Attacks)

### Attack 1: Unauthorized Read (access_codes)
- **Actor**: Anonymous user or non-admin authenticated user.
- **Action**: `get` or `list` on `/access_codes`.
- **Payload**: N/A
- **Expected Result**: `PERMISSION_DENIED`.

### Attack 2: Unauthorized Create (access_codes)
- **Actor**: Non-admin authenticated user.
- **Action**: `create` on `/access_codes/MALICIOUS_CODE`.
- **Payload**: `{ code: "MALICIOUS_CODE", active: true, owner: "Attacker", uses: 0, createdAt: request.time }`
- **Expected Result**: `PERMISSION_DENIED`.

### Attack 3: Shadow Update (Ghost Fields)
- **Actor**: Admin (simulating compromised admin or rule weakness).
- **Action**: `update` on `/access_codes/VALID_CODE`.
- **Payload**: `{ active: false, ghostField: "EXPLOIT" }`
- **Expected Result**: `PERMISSION_DENIED` (if using strict `affectedKeys().hasOnly()`).

### Attack 4: ID Poisoning
- **Actor**: Admin (testing boundary checks).
- **Action**: `create` on `/access_codes/[1.5KB_STRING]`.
- **Payload**: `{ code: "[1.5KB_STRING]", active: true, owner: "Admin", uses: 0, createdAt: request.time }`
- **Expected Result**: `PERMISSION_DENIED` (if using `isValidId()`).

### Attack 5: Spoofing Owner
- **Actor**: Admin (testing schema validation).
- **Action**: `create` on `/access_codes/CODE1`.
- **Payload**: `{ code: "CODE1", active: true, owner: "SomeOtherUser", uses: -1, createdAt: request.time }`
- **Expected Result**: `PERMISSION_DENIED` (due to `uses < 0`).

### Attack 6: Modifying Immutable Fields
- **Actor**: Admin.
- **Action**: `update` on `/access_codes/CODE1`.
- **Payload**: `{ createdAt: some_other_time }`
- **Expected Result**: `PERMISSION_DENIED`.

### Attack 7: Self-Promotion to Admin
- **Actor**: Non-admin user.
- **Action**: `create` on `/admins/[UID]`.
- **Payload**: `{ role: "admin" }`
- **Expected Result**: `PERMISSION_DENIED`.

### Attack 8: Resource Exhaustion (Long String)
- **Actor**: Admin.
- **Action**: `create` on `/access_codes/CODE1`.
- **Payload**: `{ code: "CODE1", owner: "[1MB_STRING]", ... }`
- **Expected Result**: `PERMISSION_DENIED` (due to `.size()` check).

### Attack 9: Bypass Validation via Partial Update
- **Actor**: Admin.
- **Action**: `update` on `/access_codes/CODE1`.
- **Payload**: `{ uses: "not_a_number" }`
- **Expected Result**: `PERMISSION_DENIED`.

### Attack 10: Deleting Admin Records
- **Actor**: Non-admin.
- **Action**: `delete` on `/admins/SOME_UID`.
- **Payload**: N/A
- **Expected Result**: `PERMISSION_DENIED`.

### Attack 11: Unverified Email Access
- **Actor**: User with unverified email.
- **Action**: Any write (assuming app policy requires verified email).
- **Payload**: N/A
- **Expected Result**: `PERMISSION_DENIED`.

### Attack 12: Atomic Write Bypass
- **Actor**: Attacker trying to update `uses` without valid audit (if implemented).
- **Expected Result**: `PERMISSION_DENIED`.

## 4. Conflict Report

| Collection | Identity Spoofing | State Shortcutting | Resource Poisoning |
|------------|-------------------|--------------------|-------------------|
| access_codes | Blocked (Admin only) | Blocked (Strict Keys) | Blocked (size/match) |
| admins | Blocked (Admin only) | N/A | Blocked (Admin only) |
