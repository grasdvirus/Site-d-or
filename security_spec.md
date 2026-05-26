# Security Specification: Firestop Fortress for nexus.

## 1. Data Invariants
- **Products**: Any visitor (authenticated or not) can list and get products. Only authenticated Admins (with verified email `grasdvirus@gmail.com`) can create, update, or delete products. Product prices must be positive, and stock levels must be non-negative.
- **Orders**: Orders must be linked to an authenticated user when placed from an authenticated state. An authenticated user can only view or list their own orders. Orders are immutable once created (no direct modifications of prices or status). Document IDs must match standard patterns to prevent resource poisoning.
- **Admin Concept**: Auth email must match `grasdvirus@gmail.com` with `email_verified == true`.

---

## 2. The "Dirty Dozen" Payloads

### Payload 1: Unauthenticated Product Creation
- **Target**: `products/{productId}`
- **Vulnerability Checked**: Missing authentication gate on write.
- **Rogue Payload**:
  ```json
  {
    "id": "nexus-unauth-chair",
    "name": "Rogue Chair",
    "price": 100,
    "stock": 5,
    "category": "Lounge"
  }
  ```
- **Expected Action**: `create` denied.

### Payload 2: Standard User Product Creation
- **Target**: `products/{productId}`
- **Vulnerability Checked**: Privilege escalation (non-admin writing catalog).
- **Rogue Payload**:
  ```json
  {
    "id": "nexus-user-chair",
    "name": "User Crafted Chair",
    "price": 150,
    "stock": 10,
    "category": "Lounge"
  }
  ```
- **Auth State**: Authenticated as `ordinary-user@test.com` (verified).
- **Expected Action**: `create` denied.

### Payload 3: Invalid Product Schema (Empty Name)
- **Target**: `products/{productId}`
- **Vulnerability Checked**: Schema / Type-safety validation bypass.
- **Rogue Payload**:
  ```json
  {
    "id": "nexus-bad-name",
    "name": "", 
    "price": 200,
    "stock": 10,
    "category": "Lounge"
  }
  ```
- **Auth State**: Authenticated as `grasdvirus@gmail.com` (admin, verified).
- **Expected Action**: `create` denied.

### Payload 4: Invalid Product Price (Negative)
- **Target**: `products/{productId}`
- **Vulnerability Checked**: Boundary condition / negative price poisoning.
- **Rogue Payload**:
  ```json
  {
    "id": "nexus-negative-price",
    "name": "Free Chair",
    "price": -50,
    "stock": 10,
    "category": "Lounge"
  }
  ```
- **Auth State**: Authenticated as `grasdvirus@gmail.com` (admin, verified).
- **Expected Action**: `create` denied.

### Payload 5: Admin Email Spoof Attack
- **Target**: `products/{productId}`
- **Vulnerability Checked**: Email-verification bypass.
- **Rogue Payload**:
  ```json
  {
    "id": "nexus-spoof-verif",
    "name": "Spoofed Admin Product",
    "price": 100,
    "stock": 10,
    "category": "Lounge"
  }
  ```
- **Auth State**: Authenticated as `grasdvirus@gmail.com` but `email_verified == false`.
- **Expected Action**: `create` denied.

### Payload 6: Immutable Product ID modification
- **Target**: `products/nexus-prod-123`
- **Vulnerability Checked**: Modification of immutable document fields on update.
- **Rogue Payload**:
  ```json
  {
    "id": "altered-id-456",
    "name": "Orris Chair V2",
    "price": 320,
    "stock": 15,
    "category": "Lounge"
  }
  ```
- **Auth State**: Authenticated as `grasdvirus@gmail.com` (admin, verified).
- **Expected Action**: `update` denied.

### Payload 7: Unauthenticated Order Creation
- **Target**: `orders/{orderId}`
- **Vulnerability Checked**: Creation of orders anonymously when authentication is mandated.
- **Rogue Payload**:
  ```json
  {
    "id": "order-r1",
    "fullName": "John Doe",
    "address": "123 Street",
    "city": "Paris",
    "items": [{"productId": "orris-chair", "quantity": 1}],
    "total": 320,
    "createdAt": "2026-05-26T21:14:00Z"
  }
  ```
- **Expected Action**: `create` denied (requires standard active auth).

### Payload 8: Order Identity Spoofing
- **Target**: `orders/order-r2`
- **Vulnerability Checked**: Placing an order with `userId` spoofed to another user's UID.
- **Rogue Payload**:
  ```json
  {
    "id": "order-r2",
    "userId": "victim_user_uid",
    "fullName": "Fake User",
    "address": "456 Avenue",
    "city": "Lyon",
    "items": [{"productId": "orris-chair", "quantity": 1}],
    "total": 320,
    "createdAt": "2026-05-26T21:14:00Z"
  }
  ```
- **Auth State**: Authenticated as `attacker-uid`.
- **Expected Action**: `create` denied.

### Payload 9: Illegal Read of Other User's Order
- **Target**: `orders/target-order-uuid` (belonging to `user-a`)
- **Vulnerability Checked**: PII leakage / access control bypass on individual `get` request.
- **Auth State**: Authenticated as `user-b`.
- **Expected Action**: `get` denied.

### Payload 10: Unrestricted Query Listing of Orders
- **Target**: `orders` collection get/list
- **Vulnerability Checked**: Query scraping / query delegation trust bypass on list requests.
- **Auth State**: Authenticated as `user-b` (performing list without `where("userId", "==", "user-b")`).
- **Expected Action**: `list` denied.

### Payload 11: Mega-ID Poisoning / Denial-of-Wallet Path Variable Attack
- **Target**: `products/nx-extremely-long-id-that-is-over-128-characters-long-and-contains-rogue-symbols-%%%%-to-bloat-the-wallet-and-database-node-limits-to-break-parsers`
- **Vulnerability Checked**: Path variable length sanitization and sanitization bypass.
- **Auth State**: Authenticated as `ordinary-user@test.com`.
- **Expected Action**: `get` / `create` / `delete` denied.

### Payload 12: Outcome / Status Overwriting
- **Target**: `orders/order-finalized-123`
- **Vulnerability Checked**: Modifying or deleting a finalized purchase invoice/order.
- **Rogue Payload**:
  ```json
  {
    "status": "cancelled",
    "total": 0
  }
  ```
- **Auth State**: Authenticated as `user-owner-uid`.
- **Expected Action**: `update` or `delete` denied (orders are immutable/read-only once generated).

---

## 3. Security Rules Outline (Test Assertions)
We will enforce:
- Product listing / get available to any guest.
- Authenticated admin (specifically `grasdvirus@gmail.com` with `email_verified == true`) matches for write actions on products.
- Order placement requires authentication with verified emails, matching `userId == request.auth.uid`.
- Read of orders restricted to owner of the order (`resource.data.userId == request.auth.uid`).
- Strict validation helper `isValidProduct` and `isValidOrder` verifying exact keys, bounds, type, and temporal serverside constraints (`request.time`).
