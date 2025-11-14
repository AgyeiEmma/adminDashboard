// Set a role for an admin (PUT /api/admin/admins/:adminId/role)
export async function setAdminRole(
  adminId: string,
  roleId: string,
  token: string
) {
  const response = await fetch(`/api/admin/admins/${adminId}/role`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ roleId }),
  });
  if (!response.ok) {
    throw new Error(
      (await response.json()).message || "Failed to set admin role"
    );
  }
  return response.json();
}
// src/services/roleService.ts

const API_BASE = "https://3.17.140.162:5600/auth-service/api/publichauth";
const ADMIN_API_BASE = "/api/admin";
// Fetch all roles (GET /api/admin/roles)
export async function getAllRoles(token: string) {
  const response = await fetch(`${ADMIN_API_BASE}/roles`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error((await response.json()).message || "Failed to fetch roles");
  }
  return response.json();
}

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
  if (!response.ok) {
    throw new Error((await response.json()).message || "Failed to create role");
  }
  return response.json();
}

export async function assignPermissions(
  roleId: string,
  permissions: string[],
  token: string
) {
  const response = await fetch(`${API_BASE}/roles/${roleId}/permissions`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ permissions }),
  });
  if (!response.ok) {
    throw new Error(
      (await response.json()).message || "Failed to assign permissions"
    );
  }
  return response.json();
}
