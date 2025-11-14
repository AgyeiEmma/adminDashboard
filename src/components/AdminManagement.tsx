import React, { useState, useEffect } from "react";
import {
  Users,
  Mail,
  Shield,
  Calendar,
  Search,
  Edit,
  Trash2,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface Admin {
  id: string;
  username: string;
  email: string;
  role: {
    id: string;
    name: string;
  };
  createdAt: string;
  isActive: boolean;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

const AdminManagement: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");

  useEffect(() => {
    getAdmins();
    getRoles();
  }, []);

  const getAdmins = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "https://payadmin.ismartghana.com/auth-service/api/admin/admins",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      console.log("this is the response" + response);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to fetch admins");
      }
      const data = await response.json();
      // Try to find the array of admins in common locations
      let adminsArr: any[] = [];
      if (Array.isArray(data)) {
        adminsArr = data;
      } else if (data.admins && Array.isArray(data.admins)) {
        adminsArr = data.admins;
      } else if (data.data && Array.isArray(data.data)) {
        adminsArr = data.data;
      }

      // Normalize admin objects to our Admin interface and pick up first/last names
      const normalized = adminsArr.map((item: any) => {
        const first_name = item.first_name || item.firstName || "";
        const last_name = item.last_name || item.lastName || "";
        const phone = item.phone || item.phone_number || "";
        const username =
          item.username ||
          `${first_name} ${last_name}`.trim() ||
          item.email ||
          "";
        const createdAt = item.created_at || item.createdAt || "";
        const roleId = item.role?.id || item.role_id || item.roleId || "";
        const roleName = item.role?.name || "";
        const role = { id: roleId, name: roleName };
        const isActive =
          typeof item.is_active !== "undefined"
            ? item.is_active
            : typeof item.isActive !== "undefined"
            ? item.isActive
            : true;

        return {
          id: item.id || item.admin_id || "",
          username,
          email: item.email || "",
          role,
          createdAt,
          isActive,
          first_name,
          last_name,
          phone,
        } as Admin;
      });

      setAdmins(normalized);
    } catch (err: any) {
      setError(err.message || "Failed to load admins");
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  const getRoles = async () => {
    try {
      const response = await fetch(
        "https://payadmin.ismartghana.com/auth-service/api/admin/roles",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to fetch roles");
      }
      const data = await response.json();
      let rolesArr: any[] = [];
      if (Array.isArray(data)) {
        rolesArr = data;
      } else if (data.roles && Array.isArray(data.roles)) {
        rolesArr = data.roles;
      } else if (data.data && Array.isArray(data.data)) {
        rolesArr = data.data;
      }
      setRoles(rolesArr);

      // Update any existing admins with role names if we can match by id
      setAdmins((prev) =>
        prev.map((a) => {
          if (a.role && a.role.id) {
            const match = rolesArr.find((r) => r.id === a.role.id);
            if (match)
              return { ...a, role: { id: match.id, name: match.name } };
          }
          return a;
        })
      );
    } catch {
      setRoles([]);
    }
  };

  const handleEditRole = (admin: Admin) => {
    setSelectedAdmin(admin);
    setSelectedRole(admin.role.id);
    setIsEditDialogOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedAdmin || !selectedRole) return;

    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        setError("No authentication token found. Please log in.");
        return;
      }

      const response = await fetch(
        `https://payadmin.ismartghana.com/auth-service/api/admin/admins/${selectedAdmin.id}/role`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ roleId: selectedRole }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update admin role");
      }

      // Refresh admins list
      await getAdmins();
      setIsEditDialogOpen(false);
      setSelectedAdmin(null);
      setSelectedRole("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update admin role"
      );
    }
  };

  const handleDeleteAdmin = (admin: Admin) => {
    setSelectedAdmin(admin);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteAdmin = async () => {
    if (!selectedAdmin) return;

    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        setError("No authentication token found. Please log in.");
        return;
      }

      const response = await fetch(
        `https://payadmin.ismartghana.com/auth-service/api/admin/admins/${selectedAdmin.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete admin");
      }

      // Refresh admins list
      await getAdmins();
      setIsDeleteDialogOpen(false);
      setSelectedAdmin(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete admin");
    }
  };

  const filteredAdmins = admins?.filter((admin) => {
    const firstName = admin.first_name ? admin.first_name.toLowerCase() : "";
    const lastName = admin.last_name ? admin.last_name.toLowerCase() : "";
    const username = admin.username ? admin.username.toLowerCase() : "";
    const email = admin.email ? admin.email.toLowerCase() : "";
    const phone = admin.phone ? admin.phone.toLowerCase() : "";
    const roleName =
      admin.role && admin.role.name ? admin.role.name.toLowerCase() : "";
    const search = searchTerm.toLowerCase();
    return (
      firstName.includes(search) ||
      lastName.includes(search) ||
      username.includes(search) ||
      email.includes(search) ||
      phone.includes(search) ||
      roleName.includes(search)
    );
  });

  return (
    <Card className="p-6 max-w-6xl mx-auto mt-8 shadow-lg border border-gray-200">
      <CardHeader>
        <CardTitle className="text-2xl">Admin Management</CardTitle>
        <p className="text-gray-600 mt-1">
          Manage administrator accounts and their roles
        </p>
      </CardHeader>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search by name, email, or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Admin
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                First Name
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Last Name
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Email
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Role
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Created
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Status
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  Loading admins...
                </td>
              </tr>
            ) : filteredAdmins.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  {searchTerm
                    ? "No admins found matching your search"
                    : "No admins available"}
                </td>
              </tr>
            ) : (
              filteredAdmins.map((admin) => (
                <tr
                  key={admin.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {admin.username || "-"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm">{admin.first_name || "-"}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm">{admin.last_name || "-"}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{admin.email || "-"}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-900">
                        {admin.role?.name || "-"}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        {admin.createdAt
                          ? new Date(admin.createdAt).toLocaleDateString()
                          : "-"}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        admin.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {admin.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRole(admin)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAdmin(admin)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Admin Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedAdmin?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Role
            </label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateRole}>Update Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Admin</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedAdmin?.username}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAdmin}>
              Delete Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdminManagement;
