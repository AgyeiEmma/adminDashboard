import { useState, useEffect } from "react";
import { createRole, getAllRoles, setAdminRole, assignPermissions } from "../services/roleService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Switch } from "./ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Checkbox } from "./ui/checkbox";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Users,
  Shield,
  Clock,
  Key,
  UserCog,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  Copy,
} from "lucide-react";

export function RoleManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Roles state
  const [roles, setRoles] = useState<any[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState<string | null>(null);

  // State for set role dialog and handler (must be after roles is defined)
  const [setRoleUser, setSetRoleUser] = useState<any | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [setRoleLoading, setSetRoleLoading] = useState(false);
  const [setRoleError, setSetRoleError] = useState<string | null>(null);
  const [setRoleSuccess, setSetRoleSuccess] = useState(false);

  const normalizeRoles = (list: any[]) =>
    list.map((r: any) => ({
      id: r.id || r.role_id || r.roleId || r.uuid || "",
      name: r.name || r.role_name || "Unnamed Role",
      description: r.description || "",
      permissions: Array.isArray(r.permissions) ? r.permissions : [],
      userCount: r.userCount || r.user_count || 0,
      status: r.status || "active",
      lastModified:
        r.updated_at || r.updatedAt || new Date().toISOString(),
      createdAt: r.created_at || r.createdAt || new Date().toISOString(),
    }));

  // Handler for setting admin role (ensure roles is in scope)
  const handleSetRole = (user: any) => {
    setSetRoleUser(user);
    // Find the role by name and set its id, fallback to empty string
    const found = roles.find((r: any) => r.name === user.role);
    setSelectedRoleId(found ? found.id : "");
    setSetRoleError(null);
    setSetRoleSuccess(false);
  };

  // Handler for submitting set role dialog
  const handleSetRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setRoleUser || !selectedRoleId) return;
    setSetRoleLoading(true);
    setSetRoleError(null);
    setSetRoleSuccess(false);
    try {
      const token =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("authToken");
      if (!token) throw new Error("Missing user token");
      await setAdminRole(setRoleUser.id, selectedRoleId, token);
      setSetRoleSuccess(true);
      // Optionally update user role in UI here
    } catch (err: any) {
      setSetRoleError(err.message || "Failed to set role");
    } finally {
      setSetRoleLoading(false);
    }
  };

  useEffect(() => {
    const fetchRoles = async () => {
      setRolesLoading(true);
      setRolesError(null);
      try {
        const token =
          localStorage.getItem("accessToken") ||
          localStorage.getItem("authToken");
        if (!token) throw new Error("Missing user token");
        const data = await getAllRoles(token);
        const rolesArr = Array.isArray(data) ? data : Array.isArray(data?.roles) ? data.roles : Array.isArray(data?.data) ? data.data : [];
        setRoles(normalizeRoles(rolesArr));
      } catch (err: any) {
        setRolesError(err.message || "Failed to fetch roles");
      } finally {
        setRolesLoading(false);
      }
    };
    fetchRoles();
  }, []);

  // Mock users data
  const users = [
    {
      id: "user-001",
      name: "John Doe",
      email: "john.doe@ismartpay.com",
      role: "Super Admin",
      status: "active",
      lastLogin: "2024-01-15T08:30:00Z",
      sessionCount: 3,
      twoFactorEnabled: true,
    },
    {
      id: "user-002",
      name: "Jane Smith",
      email: "jane.smith@ismartpay.com",
      role: "Treasury Manager",
      status: "active",
      lastLogin: "2024-01-15T09:15:00Z",
      sessionCount: 1,
      twoFactorEnabled: true,
    },
    {
      id: "user-003",
      name: "Mike Johnson",
      email: "mike.johnson@ismartpay.com",
      role: "Compliance Officer",
      status: "inactive",
      lastLogin: "2024-01-12T14:45:00Z",
      sessionCount: 0,
      twoFactorEnabled: false,
    },
  ];

  // All available permissions
  const allPermissions = [
    { id: "user_management", name: "User Management", category: "Admin" },
    { id: "role_management", name: "Role Management", category: "Admin" },
    { id: "system_config", name: "System Configuration", category: "Admin" },
    { id: "audit_access", name: "Audit Access", category: "Admin" },
    { id: "kyc_review", name: "KYC Review", category: "Compliance" },
    {
      id: "transaction_monitoring",
      name: "Transaction Monitoring",
      category: "Compliance",
    },
    {
      id: "fraud_investigation",
      name: "Fraud Investigation",
      category: "Compliance",
    },
    {
      id: "settlement_approval",
      name: "Settlement Approval",
      category: "Treasury",
    },
    {
      id: "reconciliation",
      name: "Manual Reconciliation",
      category: "Treasury",
    },
    {
      id: "financial_reports",
      name: "Financial Reports",
      category: "Treasury",
    },
    { id: "user_view", name: "View Users", category: "General" },
    { id: "transaction_view", name: "View Transactions", category: "General" },
    { id: "support_tickets", name: "Support Tickets", category: "General" },
    { id: "risk_reports", name: "Risk Reports", category: "Risk" },
  ];

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge variant="default" className="bg-green-500">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="secondary">
        <XCircle className="w-3 h-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Missing auth token");
      await createRole({ name: newRoleName, description: newRoleDesc }, token);
      setShowCreateRole(false);
      setNewRoleName("");
      setNewRoleDesc("");
      try {
        const token2 =
          localStorage.getItem("accessToken") || localStorage.getItem("authToken");
        if (token2) {
          const data = await getAllRoles(token2);
          const rolesArr = Array.isArray(data) ? data : Array.isArray(data?.roles) ? data.roles : Array.isArray(data?.data) ? data.data : [];
          setRoles(normalizeRoles(rolesArr));
        }
      } catch {}
    } catch (err: any) {
      setCreateError(err.message || "Failed to create role");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Role Management</h2>
          <p className="text-gray-600">
            Manage user roles and permissions with segregation of duties
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Copy className="w-4 h-4 mr-2" />
            Clone Role
          </Button>
          <Button onClick={() => setShowCreateRole(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Role
          </Button>
        </div>
      </div>

      {/* Create Role Dialog */}
      {showCreateRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowCreateRole(false)}
            >
              &times;
            </button>
            <h3 className="text-lg font-bold mb-4">Create New Role</h3>
            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <Label htmlFor="roleName">Role Name</Label>
                <Input
                  id="roleName"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="roleDesc">Description</Label>
                <Input
                  id="roleDesc"
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                />
              </div>
              {createError && (
                <div className="text-red-600 text-sm">{createError}</div>
              )}
              <div className="flex justify-end">
                <Button type="submit" disabled={createLoading}>
                  {createLoading ? "Creating..." : "Create Role"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Roles</p>
                <p className="text-2xl font-bold text-blue-600">
                  {roles.length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Users
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {users.filter((u) => u.status === "active").length}
                </p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">2FA Enabled</p>
                <p className="text-2xl font-bold text-orange-600">
                  {users.filter((u) => u.twoFactorEnabled).length}
                </p>
              </div>
              <Key className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Sessions
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {users.reduce((sum, u) => sum + u.sessionCount, 0)}
                </p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="roles" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="roles">Role Management</TabsTrigger>
          <TabsTrigger value="permissions">Permission Matrix</TabsTrigger>
          <TabsTrigger value="users">User Access</TabsTrigger>
          <TabsTrigger value="policies">Security Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Roles</CardTitle>
              <CardDescription>
                Manage roles and their associated permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="mb-6">
                <Label htmlFor="search">Search Roles</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by role name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Roles Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role Details</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Modified</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRoles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{role.name}</p>
                            <p className="text-sm text-gray-500">
                              {role.description}
                            </p>
                            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                              {role.id}
                            </code>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">
                              {role.userCount}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {role.permissions
                              .slice(0, 2)
                              .map((perm: string) => (
                                <Badge
                                  key={perm}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {perm.replace("_", " ")}
                                </Badge>
                              ))}
                            {role.permissions.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{role.permissions.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(role.status)}</TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500">
                            {new Date(role.lastModified).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>
                                    Role Details - {role.name}
                                  </DialogTitle>
                                  <DialogDescription>
                                    View and manage role permissions
                                  </DialogDescription>
                                </DialogHeader>
                                <RoleDetailsModal
                                  role={role}
                                  permissions={allPermissions}
                                />
                              </DialogContent>
                            </Dialog>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Permission Matrix</CardTitle>
              <CardDescription>
                View and manage granular permissions across roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {["Admin", "Compliance", "Treasury", "Risk", "General"].map(
                  (category) => (
                    <div key={category}>
                      <h4 className="font-medium mb-3 text-gray-900">
                        {category} Permissions
                      </h4>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Permission</TableHead>
                              {roles.map((role) => (
                                <TableHead
                                  key={role.id}
                                  className="text-center"
                                >
                                  {role.name}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {allPermissions
                              .filter((perm) => perm.category === category)
                              .map((permission) => (
                                <TableRow key={permission.id}>
                                  <TableCell className="font-medium">
                                    {permission.name}
                                  </TableCell>
                                  {roles.map((role) => (
                                    <TableCell
                                      key={role.id}
                                      className="text-center"
                                    >
                                      <Checkbox
                                        checked={role.permissions.includes(
                                          permission.id
                                        )}
                                        disabled
                                      />
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {/* Set Role Dialog */}
          {setRoleUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
                <button
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
                  onClick={() => setSetRoleUser(null)}
                >
                  &times;
                </button>
                <h3 className="text-lg font-bold mb-4">
                  Set Role for {setRoleUser.name}
                </h3>
                <form onSubmit={handleSetRoleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="roleSelect">Select Role</Label>
                    <select
                      id="roleSelect"
                      className="w-full border rounded px-3 py-2 mt-1"
                      value={selectedRoleId}
                      onChange={(e) => setSelectedRoleId(e.target.value)}
                      required
                    >
                      <option value="" disabled>
                        Select a role
                      </option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {setRoleError && (
                    <div className="text-red-600 text-sm">{setRoleError}</div>
                  )}
                  {setRoleSuccess && (
                    <div className="text-green-600 text-sm">
                      Role updated successfully!
                    </div>
                  )}
                  <div className="flex justify-end">
                    <Button type="submit" disabled={setRoleLoading}>
                      {setRoleLoading ? "Updating..." : "Update Role"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
          <Card>
            <CardHeader>
              <CardTitle>User Access Management</CardTitle>
              <CardDescription>
                Manage user accounts, sessions, and access controls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User Details</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Security</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-500">
                              {user.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">
                              {new Date(user.lastLogin).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {user.sessionCount} active sessions
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {user.twoFactorEnabled ? (
                              <Badge variant="default" className="bg-green-500">
                                <Shield className="w-3 h-3 mr-1" />
                                2FA
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                No 2FA
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetRole(user)}
                            >
                              <UserCog className="w-4 h-4" />
                              Set Role
                            </Button>
                            <Button variant="outline" size="sm">
                              Reset 2FA
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200"
                            >
                              Deactivate
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Policies</CardTitle>
              <CardDescription>
                Configure system-wide security and access policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-4">Password Policy</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Minimum Length</Label>
                        <Input type="number" value="8" className="w-20" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Require Special Characters</Label>
                        <Switch checked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Password Expiry (days)</Label>
                        <Input type="number" value="90" className="w-20" />
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-4">Session Management</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Session Timeout (minutes)</Label>
                        <Input type="number" value="30" className="w-20" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Max Concurrent Sessions</Label>
                        <Input type="number" value="3" className="w-20" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Force 2FA for Admin</Label>
                        <Switch checked />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-4">Maker-Checker Policies</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Settlement Approval Threshold</Label>
                        <p className="text-sm text-gray-500">
                          Requires dual approval above this amount
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>₵</span>
                        <Input type="number" value="1000000" className="w-32" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>User Role Changes</Label>
                        <p className="text-sm text-gray-500">
                          Require approval for role modifications
                        </p>
                      </div>
                      <Switch checked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>KYC Rejection Override</Label>
                        <p className="text-sm text-gray-500">
                          Require senior approval to override KYC decisions
                        </p>
                      </div>
                      <Switch checked />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button variant="outline">Reset to Defaults</Button>
                  <Button>Save Policies</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RoleDetailsModal({
  role,
  permissions,
}: {
  role: any;
  permissions: any[];
}) {
  const [selectedPerms, setSelectedPerms] = useState<string[]>(
    Array.isArray(role.permissions) ? role.permissions : []
  );
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const togglePerm = (id: string) => {
    setSelectedPerms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSavePermissions = async () => {
    setSaveLoading(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const token =
        localStorage.getItem("accessToken") || localStorage.getItem("authToken");
      if (!token) throw new Error("Missing user token");
      await assignPermissions(role.id, selectedPerms, token);
      setSaveSuccess(true);
    } catch (err: any) {
      setSaveError(err.message || "Failed to assign permissions");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium mb-3">Role Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Role Name:</span>
              <span className="font-medium">{role.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Description:</span>
              <span className="font-medium">{role.description}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Users Assigned:</span>
              <span className="font-medium">{role.userCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span className="font-medium">
                {new Date(role.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-3">Permissions</h4>
          <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2">
            {["Admin", "Compliance", "Treasury", "Risk", "General"].map(
              (category) => (
                <div key={category}>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    {category}
                  </h5>
                  <div className="grid grid-cols-1 gap-2">
                    {permissions
                      .filter((p) => p.category === category)
                      .map((perm) => (
                        <label
                          key={perm.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPerms.includes(perm.id)}
                            onChange={() => togglePerm(perm.id)}
                          />
                          <span>{perm.name}</span>
                        </label>
                      ))}
                  </div>
                </div>
              )
            )}
          </div>
          {saveError && (
            <div className="text-red-600 text-sm mt-3">{saveError}</div>
          )}
          {saveSuccess && (
            <div className="text-green-600 text-sm mt-3">
              Permissions updated.
            </div>
          )}
          <div className="flex justify-end mt-4">
            <button
              onClick={handleSavePermissions}
              disabled={saveLoading}
              className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
            >
              {saveLoading ? "Saving..." : "Save Permissions"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
