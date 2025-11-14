import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Users,
  Percent,
  TrendingUp,
  Search,
  Filter,
} from "lucide-react";
import { formatCurrency } from "../utils/currency";
import axios from "axios";
// Note: FeeManagement uses direct fetch to the adminFees endpoint (matches AdminManagement.tsx)

// Service options: IMPORTANT
// These must be the real service UUIDs the API expects for `service_id`.
// Replace these placeholders with the actual IDs from your backend if different.
const SERVICE_OPTIONS = [
  { id: "5e5ec63f-6b04-4ece-891e-eb19ced0f5c9", name: "Collection Service" },
  { id: "a1b2c3d4-1111-2222-3333-444455556666", name: "Disbursement Service" },
  { id: "b1c2d3e4-7777-8888-9999-0000aaaabbbb", name: "Transfer Service" },
  { id: "c1d2e3f4-1212-3434-5656-787878787878", name: "Card Payment Service" },
  { id: "d1e2f3a4-4242-4242-4242-424242424242", name: "Mobile Money Service" },
  { id: "e1f2a3b4-5252-5252-5252-525252525252", name: "Bank Transfer Service" },
];

// Mock data for general fees
const generalFeesData = [
  {
    id: "GF001",
    name: "Collection Fee",
    description: "Standard fee for all collection transactions",
    feeType: "rate",
    rate: 1.5,
    amount: 0,
    appliedTo: "Collection Service",
    status: "Active",
    createdAt: "2025-01-15 10:30",
  },
  {
    id: "GF002",
    name: "Disbursement Fee",
    description: "Fixed fee for disbursement operations",
    feeType: "flat_fee",
    rate: 0,
    amount: 5.0,
    appliedTo: "Disbursement Service",
    status: "Active",
    createdAt: "2025-01-20 14:20",
  },
  {
    id: "GF003",
    name: "Transfer Fee",
    description: "Fee for bank-to-bank transfers",
    feeType: "rate",
    rate: 0.75,
    amount: 0,
    appliedTo: "Transfer Service",
    status: "Active",
    createdAt: "2025-02-01 09:15",
  },
  {
    id: "GF004",
    name: "Card Processing Fee",
    description: "Fee for card payment processing",
    feeType: "rate",
    rate: 2.5,
    amount: 0,
    appliedTo: "Card Payment Service",
    status: "Active",
    createdAt: "2025-02-10 11:45",
  },
];

// Mock data for custom fees
const customFeesData = [
  {
    id: "CF001",
    userId: "USR12345",
    userName: "Kwame Asante",
    userEmail: "kwame@business.com",
    name: "Special Collection Fee",
    description: "Custom rate for high-volume merchant",
    feeType: "rate",
    rate: 0.8,
    amount: 0,
    appliedTo: "Collection Service",
    status: "Active",
    createdAt: "2025-03-01 08:30",
  },
  {
    id: "CF002",
    userId: "USR12346",
    userName: "Ama Boateng",
    userEmail: "ama@enterprise.com",
    name: "VIP Disbursement Fee",
    description: "Reduced flat fee for VIP customer",
    feeType: "flat_fee",
    rate: 0,
    amount: 2.5,
    appliedTo: "Disbursement Service",
    status: "Active",
    createdAt: "2025-03-05 15:20",
  },
  {
    id: "CF003",
    userId: "USR12347",
    userName: "Kofi Mensah",
    userEmail: "kofi@startup.com",
    name: "Custom Transfer Fee",
    description: "Startup discount on transfer fees",
    feeType: "rate",
    rate: 0.5,
    amount: 0,
    appliedTo: "Transfer Service",
    status: "Active",
    createdAt: "2025-03-10 12:00",
  },
];

// Mock users for selection
const mockUsers = [
  { id: "USR12345", name: "Kwame Asante", email: "kwame@business.com" },
  { id: "USR12346", name: "Ama Boateng", email: "ama@enterprise.com" },
  { id: "USR12347", name: "Kofi Mensah", email: "kofi@startup.com" },
  { id: "USR12348", name: "Akosua Darkwa", email: "akosua@company.com" },
  { id: "USR12349", name: "Yaw Osei", email: "yaw@business.gh" },
];

export function FeeManagement() {
  const [generalFees, setGeneralFees] = useState<any[]>([]);
  const [customFees, setCustomFees] = useState(customFeesData);
  const [showGeneralFeeDialog, setShowGeneralFeeDialog] = useState(false);
  const [showCustomFeeDialog, setShowCustomFeeDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [loadingFees, setLoadingFees] = useState(false);
  const [feesError, setFeesError] = useState<string | null>(null);
  const [submittingGeneralFee, setSubmittingGeneralFee] = useState(false);
  // Summary cards state (fetched from /fees/summary)
  const [summary, setSummary] = useState<{
    today_total_charges: number;
    monthly_avg_charges: number;
    total_general_fees: number;
    total_custom_fees: number;
  }>({
    today_total_charges: 0,
    monthly_avg_charges: 0,
    total_general_fees: 0,
    total_custom_fees: 0,
  });
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Form states for General Fee
  const [generalFeeForm, setGeneralFeeForm] = useState({
    name: "",
    description: "",
    feeType: "rate",
    rate: "",
    amount: "",
    // store the service UUID (not the human-readable name) so we POST a valid service_id
    appliedTo: SERVICE_OPTIONS[0].id,
    channel: "MOBILE_MONEY",
    status: "Active",
  });

  // Form states for Custom Fee
  const [customFeeForm, setCustomFeeForm] = useState({
    userId: "",
    name: "",
    description: "",
    feeType: "rate",
    rate: "",
    amount: "",
    // store the service UUID here as well
    appliedTo: SERVICE_OPTIONS[0].id,
  });

  // Helper: resolve a service id to a human readable name for UI display
  const getServiceNameById = (id: string) => {
    const found = SERVICE_OPTIONS.find((s) => s.id === id);
    return found ? found.name : undefined;
  };

  // console.log("it is working ");

  const handleAddGeneralFee = async () => {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(
      now.getHours()
    ).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    // console.log("it is working ");
    // console.log(handleAddCustomFee);
    // Prepare payload according to API expectations
    // Shape required by backend (example):
    // {
    //   "type": "flat_fee",
    //   "rate": null,
    //   "amount": "5",
    //   "name": "Airtime fee",
    //   "description": "This is the fee for airtime",
    //   "service_id": "<service-uuid>",
    //   "status": "active",
    //   "channel": "WALLET"
    // }
    const isRate = generalFeeForm.feeType === "rate";
    const payload: Record<string, any> = {
      type: isRate ? "rate" : "flat_fee",
      rate: isRate
        ? generalFeeForm.rate
          ? parseFloat(String(generalFeeForm.rate))
          : null
        : null,
      amount: !isRate
        ? generalFeeForm.amount != null
          ? String(generalFeeForm.amount)
          : ""
        : null,
      name: generalFeeForm.name,
      description: generalFeeForm.description,
      // NOTE: `service_id` must be the service UUID expected by the API.
      // Currently `appliedTo` contains human-readable names; update the select values
      // to the real IDs if the API requires UUIDs.
      service_id: generalFeeForm.appliedTo,
      status: generalFeeForm.status
        ? String(generalFeeForm.status).toLowerCase()
        : "active",
      channel: generalFeeForm.channel
        ? String(generalFeeForm.channel).toUpperCase()
        : "MOBILE_MONEY",
    };

    // Log payload for debugging — remove in production
    console.debug("Creating fee with payload:", payload);

    // console.log("it is working ");

    // POST to backend and refresh list on success
    setSubmittingGeneralFee(true);
    setFeesError(null);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      const url = "https://3.17.140.162:5600/auth-service/api/adminFees/fees";

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
      // console.log(url);

      const response = await axios.post(url, payload, { headers });
      console.log("Create fee payload:", payload);

      // Validate HTTP status
      const respStatus = response.status;
      const respData = response.data;

      if (!(respStatus >= 200 && respStatus < 300)) {
        throw new Error(`Create fee failed with status ${respStatus}`);
      }

      // Handle APIs that return 200 but signal error in body
      if (
        respData &&
        (respData.error ||
          respData.success === false ||
          String(respData.status).toLowerCase() === "error")
      ) {
        const serverMsg = respData.message || JSON.stringify(respData);
        throw new Error(serverMsg);
      }

      // Success: refresh list and close dialog
      await fetchFees();

      setShowGeneralFeeDialog(false);
      setGeneralFeeForm({
        name: "",
        description: "",
        feeType: "rate",
        rate: "",
        amount: "",
        appliedTo: "Collection Service",
        channel: "MOBILE_MONEY",
        status: "Active",
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create fee";
      console.error("Create fee failed:", err);
      setFeesError(errorMessage);
    } finally {
      setSubmittingGeneralFee(false);
    }
  };




  const handleAddCustomFee = () => {
    const selectedUser = mockUsers.find((u) => u.id === customFeeForm.userId);
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(
      now.getHours()
    ).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const newFee = {
      id: `CF${String(customFees.length + 1).padStart(3, "0")}`,
      userId: customFeeForm.userId,
      userName: selectedUser?.name || "",
      userEmail: selectedUser?.email || "",
      name: customFeeForm.name,
      description: customFeeForm.description,
      feeType: customFeeForm.feeType,
      rate:
        customFeeForm.feeType === "rate" ? parseFloat(customFeeForm.rate) : 0,
      amount:
        customFeeForm.feeType === "flat_fee"
          ? parseFloat(customFeeForm.amount)
          : 0,
      appliedTo:
        getServiceNameById(customFeeForm.appliedTo) ?? customFeeForm.appliedTo,
      status: "Active",
      createdAt: formattedDate,
    };

    setCustomFees([...customFees, newFee]);
    setShowCustomFeeDialog(false);
    setCustomFeeForm({
      userId: "",
      name: "",
      description: "",
      feeType: "rate",
      rate: "",
      amount: "",
      appliedTo: "Collection Service",
    });
  };


  const handleDeleteGeneralFee = (id: string) => {
    setGeneralFees(generalFees.filter((fee) => fee.id !== id));
  };

  const handleDeleteCustomFee = (id: string) => {
    setCustomFees(customFees.filter((fee) => fee.id !== id));
  };

  // Fetch fees from backend API and map to UI structure


  const fetchFees = async () => {
    setLoadingFees(true);
    setFeesError(null);
    try {
      const token = localStorage.getItem("authToken");
      const url = "https://3.17.140.162:5600/auth-service/api/adminFees/fees";

      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const response = await axios.get(url, { headers });

      const data = response.data;

      // Normalize where the API might return data in different shapes
      let payload = [];
      if (Array.isArray(data)) {
        payload = data;
      } else if (Array.isArray(data.data)) {
        payload = data.data;
      } else if (Array.isArray(data.fees)) {
        payload = data.fees;
      }

      if (!Array.isArray(payload) || payload.length === 0) {
        setGeneralFees(generalFeesData);
        return;
      }

      const mapped = payload.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        feeType: item.type === "rate" ? "rate" : "flat_fee",
        rate: item.rate ? parseFloat(item.rate) : 0,
        amount: item.amount ? parseFloat(item.amount) : 0,
        appliedTo: item.service_name || item.applied_to || "Unknown Service",
        channel: item.channel || item.channels || "MOBILE_MONEY",
        status: item.status || "Active",
        createdAt: item.created_at
          ? new Date(item.created_at).toLocaleString()
          : "",
      }));

      setGeneralFees(mapped);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch fees";
      setFeesError(errorMessage);
      setGeneralFees(generalFeesData);
    } finally {
      setLoadingFees(false);
    }
  };

  
  // Fetch summary for the top cards
  const fetchSummary = async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const token = localStorage.getItem("authToken");
      const url =
        "https://3.17.140.162:5600/auth-service/api/adminFees/fees/summary";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      console.log("fetchSummary request:", { url, headers, token });

      const response = await axios.get(url, { headers });
      const respData = response.data;

      if (respData && respData.data) {
        setSummary({
          today_total_charges: Number(respData.data.today_total_charges) || 0,
          monthly_avg_charges: Number(respData.data.monthly_avg_charges) || 0,
          total_general_fees: Number(respData.data.total_general_fees) || 0,
          total_custom_fees: Number(respData.data.total_custom_fees) || 0,
        });
      } else {
        setSummary({
          today_total_charges: 0,
          monthly_avg_charges: 0,
          total_general_fees: 0,
          total_custom_fees: 0,
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch summary";
      setSummaryError(errorMessage);
    } finally {
      setSummaryLoading(false);
    }
  };


  useEffect(() => {
    fetchFees();
    fetchSummary();
  }, []);

  const renderGeneralFeesTab = () => (
    <div className="space-y-4">
      {loadingFees ? (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-700">Loading fees...</p>
        </div>
      ) : feesError ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-700">{feesError}</p>
        </div>
      ) : null}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-gray-900">General Fee Configuration</h3>
          <p className="text-sm text-gray-500 mt-1">
            These fees apply to all businesses and customers using the service
          </p>
        </div>
        <Dialog
          open={showGeneralFeeDialog}
          onOpenChange={setShowGeneralFeeDialog}
        >
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add General Fee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add General Fee</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Fee Name</Label>
                <Input
                  placeholder="e.g., Collection Fee, Transfer Fee"
                  value={generalFeeForm.name}
                  onChange={(e) =>
                    setGeneralFeeForm({
                      ...generalFeeForm,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Brief description of the fee"
                  value={generalFeeForm.description}
                  onChange={(e) =>
                    setGeneralFeeForm({
                      ...generalFeeForm,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Fee Type</Label>
                <Select
                  value={generalFeeForm.feeType}
                  onValueChange={(value) =>
                    setGeneralFeeForm({ ...generalFeeForm, feeType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rate">Rate (%)</SelectItem>
                    <SelectItem value="flat_fee">Flat Fee (₵)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {generalFeeForm.feeType === "rate" ? (
                <div className="space-y-2">
                  <Label>Rate (%)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g., 1.5"
                      value={generalFeeForm.rate}
                      onChange={(e) =>
                        setGeneralFeeForm({
                          ...generalFeeForm,
                          rate: e.target.value,
                        })
                      }
                    />
                    <Percent className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Amount (₵)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g., 5.00"
                      value={generalFeeForm.amount}
                      onChange={(e) =>
                        setGeneralFeeForm({
                          ...generalFeeForm,
                          amount: e.target.value,
                        })
                      }
                    />
                    <DollarSign className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Applied To / Service Name</Label>
                <Select
                  value={generalFeeForm.appliedTo}
                  onValueChange={(value) =>
                    setGeneralFeeForm({ ...generalFeeForm, appliedTo: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_OPTIONS.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Channel</Label>
                <Select
                  value={generalFeeForm.channel}
                  onValueChange={(value) =>
                    setGeneralFeeForm({ ...generalFeeForm, channel: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MOBILE_MONEY">MOBILE_MONEY</SelectItem>
                    <SelectItem value="WALLET">WALLET</SelectItem>
                    <SelectItem value="INSTANT">INSTANT</SelectItem>
                    <SelectItem value="FIX CYCLE">FIX CYCLE</SelectItem>
                    <SelectItem value="T1">T1</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={generalFeeForm.status} disabled>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Status is fixed to Active and cannot be changed here.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowGeneralFeeDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddGeneralFee}
                  disabled={
                    submittingGeneralFee ||
                    !generalFeeForm.name ||
                    !generalFeeForm.description ||
                    (generalFeeForm.feeType === "rate"
                      ? !generalFeeForm.rate
                      : !generalFeeForm.amount)
                  }
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {submittingGeneralFee ? "Adding..." : "Add Fee"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  Name
                </th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  Description
                </th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  Fee Type
                </th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  Rate
                </th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  Amount
                </th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  Applied To / Service
                </th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  Created At
                </th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {generalFees.map((fee) => (
                <tr
                  key={fee.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {fee.name}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                    {fee.description}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline" className="text-xs">
                      {fee.feeType}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {fee.feeType === "rate" ? `${fee.rate}%` : "-"}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {fee.feeType === "flat_fee"
                      ? formatCurrency(fee.amount)
                      : "-"}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {getServiceNameById(fee.appliedTo) ?? fee.appliedTo}
                  </td>
                  <td className="py-3 px-4">
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      {fee.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {fee.createdAt}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4 text-gray-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteGeneralFee(fee.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderCustomFeesTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-gray-900">Custom Fee Configuration</h3>
          <p className="text-sm text-gray-500 mt-1">
            These fees are attached to specific users/businesses
          </p>
        </div>
        <Dialog
          open={showCustomFeeDialog}
          onOpenChange={setShowCustomFeeDialog}
        >
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Fee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Custom Fee</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select User</Label>
                <Select
                  value={customFeeForm.userId}
                  onValueChange={(value) =>
                    setCustomFeeForm({ ...customFeeForm, userId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fee Name</Label>
                <Input
                  placeholder="e.g., VIP Collection Fee, Special Rate"
                  value={customFeeForm.name}
                  onChange={(e) =>
                    setCustomFeeForm({ ...customFeeForm, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Brief description of the custom fee"
                  value={customFeeForm.description}
                  onChange={(e) =>
                    setCustomFeeForm({
                      ...customFeeForm,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Fee Type</Label>
                <Select
                  value={customFeeForm.feeType}
                  onValueChange={(value) =>
                    setCustomFeeForm({ ...customFeeForm, feeType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rate">Rate (%)</SelectItem>
                    <SelectItem value="flat_fee">Flat Fee (₵)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {customFeeForm.feeType === "rate" ? (
                <div className="space-y-2">
                  <Label>Rate (%)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g., 1.5"
                      value={customFeeForm.rate}
                      onChange={(e) =>
                        setCustomFeeForm({
                          ...customFeeForm,
                          rate: e.target.value,
                        })
                      }
                    />
                    <Percent className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Amount (₵)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g., 5.00"
                      value={customFeeForm.amount}
                      onChange={(e) =>
                        setCustomFeeForm({
                          ...customFeeForm,
                          amount: e.target.value,
                        })
                      }
                    />
                    <DollarSign className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Applied To / Service Name</Label>
                <Select
                  value={customFeeForm.appliedTo}
                  onValueChange={(value) =>
                    setCustomFeeForm({ ...customFeeForm, appliedTo: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_OPTIONS.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCustomFeeDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddCustomFee}
                  disabled={
                    !customFeeForm.userId ||
                    !customFeeForm.name ||
                    !customFeeForm.description ||
                    (customFeeForm.feeType === "rate"
                      ? !customFeeForm.rate
                      : !customFeeForm.amount)
                  }
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Add Fee
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  User
                </th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  Name
                </th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  Description
                </th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  Fee Type
                </th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  Rate
                </th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  Amount
                </th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  Applied To / Service
                </th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  Created At
                </th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {customFees.map((fee) => (
                <tr
                  key={fee.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-900">{fee.userName}</p>
                        <p className="text-xs text-gray-500">{fee.userEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {fee.name}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                    {fee.description}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline" className="text-xs">
                      {fee.feeType}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {fee.feeType === "rate" ? `${fee.rate}%` : "-"}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {fee.feeType === "flat_fee"
                      ? formatCurrency(fee.amount)
                      : "-"}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {getServiceNameById(fee.appliedTo) ?? fee.appliedTo}
                  </td>
                  <td className="py-3 px-4">
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      {fee.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {fee.createdAt}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4 text-gray-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCustomFee(fee.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">Fee Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure general and custom fee structures for transactions
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Fees Today</p>
              <p className="text-2xl text-gray-900 mt-1">
                {formatCurrency(summary.today_total_charges)}
              </p>
              <p className="text-sm text-green-600 mt-1">
                {summaryLoading ? "Loading..." : ""}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">General Fees</p>
              <p className="text-2xl text-gray-900 mt-1">
                {summary.total_general_fees ?? generalFees.length}
              </p>
              <p className="text-sm text-gray-500 mt-1">Active rules</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100">
              <Percent className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Custom Fees</p>
              <p className="text-2xl text-gray-900 mt-1">
                {summary.total_custom_fees ?? customFees.length}
              </p>
              <p className="text-sm text-gray-500 mt-1">User-specific rules</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monthly Avg Charges</p>
              <p className="text-2xl text-gray-900 mt-1">
                {formatCurrency(summary.monthly_avg_charges)}
              </p>
              <p className="text-sm text-green-600 mt-1">
                {summaryLoading ? "Loading..." : ""}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-orange-100">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto">
          <TabsTrigger value="general">General Fees</TabsTrigger>
          <TabsTrigger value="custom">Custom Fees</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          {renderGeneralFeesTab()}
        </TabsContent>

        <TabsContent value="custom" className="mt-6">
          {renderCustomFeesTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
