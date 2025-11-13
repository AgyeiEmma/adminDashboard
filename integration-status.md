# Integration Status

## Implemented and Integrated

- **Admin authentication** – The login page posts directly to the hosted admin login endpoint and stores the returned token; the backend exposes the matching `/api/publicauth/admin/login` route.

```24:57:src/components/LoginPage.tsx
      const response = await fetch(
        "http://3.17.140.162:5600/auth-service/api/publicauth/admin/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );
      ...
      if (token) {
        console.log("Token found and saved:", token);
        localStorage.setItem("authToken", token);
        onLogin();
      }
```

```21:22:ismart_auth_service/routes/publicAuthRoutes.js
router.post("/admin/register", adminController.register);
router.post("/admin/login", adminController.login);
```

- **Admin roster & role assignment** – The dashboard loads admins and roles from `/api/admin/...` endpoints and pushes role updates back to the service.

```71:125:src/components/AdminManagement.tsx
      const response = await fetch(
        "http://3.17.140.162:5600/auth-service/api/admin/admins",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      ...
      const response = await fetch(
        `http://3.17.140.162:5600/auth-service/api/admin/admins/${selectedAdmin.id}/role`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ roleId: selectedRole }),
        }
      );
```

```10:23:ismart_auth_service/routes/adminRoutes.js
router.post("/roles", tokenAuth({ required: true }), authorizeRole("SuperAdmin"), adminController.createRole);
router.put("/roles/:roleId/permissions", tokenAuth({ required: true }), authorizeRole("SuperAdmin"), adminController.assignPermissions);
router.get("/roles", tokenAuth({ required: true }), adminController.getRoles);
router.get("/roles/:roleId", tokenAuth({ required: true }), adminController.getRoleById);
router.put("/admins/:adminId/role", tokenAuth({ required: true }), authorizeRole("SuperAdmin"), adminController.assignRole);
router.get("/admins/:adminId", tokenAuth({ required: true }), authorizeRole("SuperAdmin"), adminController.getAdminById);
router.get("/admins", tokenAuth({ required: true }), authorizeRole("SuperAdmin"), adminController.getAllAdmins);
```

- **General fee configuration** – The fees screen reads and writes general fee definitions against `/api/adminFees/fees`.

```258:377:src/components/FeeManagement.tsx
      const url = "http://3.17.140.162:5600/auth-service/api/adminFees/fees";
      ...
      const response = await axios.post(url, payload, { headers });
      ...
    const fetchFees = async () => {
      ...
      const url = "http://3.17.140.162:5600/auth-service/api/adminFees/fees";
      ...
      const response = await axios.get(url, { headers });
```

```6:11:ismart_auth_service/routes/adminFeeRoutes.js
router.post("/fees", tokenAuth({ required: true }), authorizeRole("Admin", "SuperAdmin"), adminFeeController.createFee);
router.get("/fees", tokenAuth({ required: true }), authorizeRole("Admin", "SuperAdmin"), adminFeeController.getAllFees);
router.post("/fees/custom", tokenAuth({ required: true }), authorizeRole("Admin", "SuperAdmin"), adminFeeController.createCustomFee);
router.get("/fees/custom", tokenAuth({ required: true }), authorizeRole("Admin", "SuperAdmin"), adminFeeController.getAllCustomFees);
```

- **KYC review workflow** – The reviewer view pulls KYC submissions, loads document detail, and sends approve/reject decisions to the backend KYC review routes.

```120:355:src/components/KYCVerification.tsx
      const response = await fetch(`${API_BASE_URL}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      ...
      const response = await fetch(`${API_BASE_URL}/${application}/review`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "APPROVED",
          review_notes: reviewNotes,
        }),
      });
      ...
      const response = await fetch(`${API_BASE_URL}/${documentId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
```

```6:18:ismart_auth_service/routes/adminReviewRoutes.js
router.get("/kyc-documents", tokenAuth({ required: true }), authorizeRole("RiskReviewer", "Admin", "SuperAdmin"), adminReviewController.getAllKycDocuments);
router.get("/kyc-documents/:id", tokenAuth({ required: true }), authorizeRole("RiskReviewer", "Admin", "SuperAdmin"), adminReviewController.getKycDocumentById);
router.put("/kyc-documents/:id/review", tokenAuth({ required: true }), authorizeRole("RiskReviewer", "Admin", "SuperAdmin"), adminReviewController.reviewKycDocument);
router.get("/business-risk-documents", tokenAuth({ required: true }), authorizeRole("RiskReviewer", "Admin", "SuperAdmin"), adminReviewController.getAllBusinessRiskDocs);
router.get("/documents", tokenAuth({ required: true }), authorizeRole("Admin", "SuperAdmin"), adminReviewController.getAllDocuments);
```

## Implemented but not Integrated

- **Role creation & permission assignment** – The backend supports dedicated role-management routes, but the frontend client posts to a misspelled `publichauth` base URL, so create/permission calls never hit the admin API.

```24:55:src/services/roleService.ts
const API_BASE = "http://3.17.140.162:5600/auth-service/api/publichauth";
...
export async function createRole(
  roleData: { name: string; description?: string },
  token: string
) {
  const response = await fetch(`${API_BASE}/roles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(roleData),
  });
```

- **Custom fee configuration** – The backend exposes `/api/adminFees/fees/custom`, but the UI keeps custom fees in in-memory mock collections.

```312:352:src/components/FeeManagement.tsx
  const handleAddCustomFee = () => {
    const selectedUser = mockUsers.find((u) => u.id === customFeeForm.userId);
    ...
    const newFee = {
      id: `CF${String(customFees.length + 1).padStart(3, "0")}`,
      userId: customFeeForm.userId,
      userName: selectedUser?.name || "",
      userEmail: selectedUser?.email || "",
      ...
    };

    setCustomFees([...customFees, newFee]);
```

- **Reports & analytics endpoints** – `/api/report` serves customer, user, and business reports, yet the analytics pages render purely from hard-coded datasets.

```6:15:ismart_auth_service/routes/adminReportRoutes.js
router.get("/customers", tokenAuth, authorizeRole("Admin", "SuperAdmin"), adminController.getAllCustomers);
router.get("/users", tokenAuth, authorizeRole("Admin", "SuperAdmin"), adminController.getAllUsers);
router.get("/businesses", tokenAuth, authorizeRole("Admin", "SuperAdmin"), adminController.getAllBusinesses);
```

```35:107:src/components/ReportsPage.tsx
// Mock data for KPI scorecards
const kpiScorecard = [
  { metric: 'Transaction Success Rate', current: 98.8, target: 98.0, trend: 'up', unit: '%' },
  ...
];
// Mock data for scheduled reports
const scheduledReports = [
  {
    id: 'SR001',
    name: 'Daily Settlement Summary',
    type: 'Settlement',
    schedule: 'Daily at 6:00 AM',
    ...
  },
];
// Mock data for recent reports
const recentReports = [
  {
    id: 'RPT001',
    name: 'Settlement Summary - October 16, 2025',
    ...
  },
];
```

- **Ticketing & dispute casework** – The auth service ships a full ticket lifecycle API, but the admin UI models disputes from mock data instead of calling it.

```19:28:ismart_auth_service/routes/ticketRoutes.js
router.get("/all", tokenAuth({ required: true }), authorizeRole("Admin", "SuperAdmin"), getAllTickets);
router.post("/create-ticket", tokenAuth({ required: true }), createTicket);
router.post("/:id/assign", tokenAuth({ required: true }), authorizeRole("Admin", "SuperAdmin"), assignTicket);
router.get("/:id/assignment-history", tokenAuth({ required: true }), getAssignmentHistory);
```

```82:85:src/components/DisputeManagement.tsx
          {/* Disputes List */}
          <div className="space-y-4">
            {[
              ...mockDisputes,
              { id: 'DSP-003', transactionId: 'TXN-20251003-045', userId: 3, userName: 'Kofi Asante', amount: 850.00, reason: 'Duplicate charge', status: 'pending_evidence', createdAt: '2025-10-06T16:20:00' },
            ].map(dispute => (
```

- **Team management APIs** – Backend routes cover team creation, membership, and detail fetches, but no frontend workflow calls them yet.

```7:41:ismart_auth_service/routes/teamRoutes.js
router.post(
  "/:businessId/create",
  tokenAuth({ required: true }),
  checkIfUserIsBusinessContact,
  TeamController.createTeam
);
router.post(
  "/:teamId/add-member",
  tokenAuth({ required: true }),
  checkIfUserIsBusinessContact,
  TeamController.addMember
);
router.get(
  "/:businessId",
  tokenAuth({ required: true }),
  TeamController.getTeams
);
router.get(
  "/:teamId/members",
  tokenAuth({ required: true }),
  TeamController.getTeamMembers
);
```

## Neither

- **Real-time transaction monitoring** – The UI populates tables and charts from static arrays, and the backend registers no `/api/transactions` route.

```10:81:src/components/TransactionMonitoring.tsx
const transactions = [
  {
    id: 'TXN001',
    timestamp: '2024-10-07 14:30:25',
    merchantName: 'Kwame\'s Electronics',
    ...
  },
  ...
];
const hourlyData = [
  { hour: '09:00', transactions: 45, volume: 125000 },
  ...
];
```

```31:40:ismart_auth_service/main.js
app.use("/api/publicauth", authPublicRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reviews", adminReviewRoutes);
app.use("/api/report", adminReportRoutes);
app.use("/api/adminFees", feeRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/feeChecker", feeChecker);
app.use("/api/team", teamRoutes);
```

- **Audit trail explorer** – The audit log screen renders from a mock array; no backend controller exposes audit data yet.

```63:107:src/components/AuditLogs.tsx
  // Mock audit logs data
  const auditLogs = [
    {
      id: "audit-001",
      timestamp: "2024-01-15T14:23:45Z",
      user: "john.doe@ismartpay.com",
      ...
    },
    ...
  ];
```

- **Gamified goals & learning modules** – Badge, goal, and learning components operate entirely on front-end constants without corresponding server support.

```20:88:src/components/BadgeSystem.tsx
const badges: BadgeData[] = [
  {
    id: 'first-lesson',
    title: 'First Steps',
    description: 'Complete your first financial lesson',
    icon: BookOpen,
    category: 'learning',
    rarity: 'common',
    isUnlocked: true,
    unlockedAt: '2024-01-15',
    reward: '₵5 bonus'
  },
  ...
];
```


