import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Check,
  X,
  Eye,
  Clock,
  AlertCircle,
  FileText,
  Image,
  User,
} from "lucide-react";

// API Base URL
const API_BASE_URL =
  "https://gateway.ismartghana.com/auth-service/api/reviews/kyc-documents";

// Transform dbResponse to match the UI structure
const transformDbResponse = (dbData: any[]) => {
  return dbData.map((item) => {
    const customer = item.customer || {};
    const user = item.users || {};

    // Extract name - if customer, show "FirstName LastName", if user, show full_name
    let userName = "-";
    let fullName = "-";

    if (customer && customer.first_name) {
      // It's a customer - combine first_name and last_name
      userName = `${customer.first_name} ${customer.last_name || ""}`.trim();
      fullName = userName;
    } else if (user && user.full_name) {
      // It's a user - use full_name directly
      userName = user.full_name;
      fullName = user.full_name;
    }

    console.log("Transforming KYC item:", item);

    return {
      // Always use the backend UUID for all actions and display
      id: item.id, // UUID for review actions and display
      userId: item.customer_id || item.user_id,
      userName: userName,
      email: customer.email || user.email || "-",
      submittedDate: item.created_at
        ? new Date(item.created_at).toLocaleDateString()
        : "-",
      status: item.status || "PENDING",
      documentType: item.document_type?.replace(/_/g, " ") || "Ghana Card",
      documents: {
        idFront: item.document_front_url || null,
        idBack: item.document_back_url || null,
        selfie: item.selfie_url || null,
        proofOfAddress: null,
      },
      personalInfo: {
        fullName: fullName,
        dateOfBirth: user.dob || "-",
        idNumber: "-",
        address: user.residential_address || "-",
        occupation: "-",
      },
      reviewNotes: item.review_notes || "",
      // reviewer info when available from list endpoint
      reviewedBy: item.reviewed_by || item.reviewedBy || item.reviewer || null,
    };
  });
};

export function KYCVerification() {
  const [kycApplications, setKycApplications] = useState<any[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch KYC applications on component mount

  useEffect(() => {
    fetchKYCApplications();
    // Only fetch once on mount
    // Remove any interval or repeated fetch logic
  }, []);

  // Helper to safely get nested values
  const safe = (fn: () => any, fallback: any = "-") => {
    try {
      const v = fn();
      return v === null || v === undefined ? fallback : v;
    } catch {
      return fallback;
    }
  };

  const fetchKYCApplications = async () => {
    setLoading(true);
    setError(null);
    let mapped: any[] = [];
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      const response = await fetch(`${API_BASE_URL}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      let kycData: any[] = [];
      if (response.ok) {
        const data = await response.json();

        if (Array.isArray(data)) {
          kycData = data;
        } else if (data.data && Array.isArray(data.data)) {
          kycData = data.data;
        } else if (data.applications && Array.isArray(data.applications)) {
          kycData = data.applications;
        }
      }

      // If API returns no data, fallback to mock
      if (!kycData || kycData.length === 0) {
        // mapped = transformDbResponse(dbResponse);
        console.log("API returned no KYC data, using mock data instead.");
      } else {
        mapped = transformDbResponse(kycData);
        //   mapped = kycData.map((item) => {
        //     const customer = item.customer || {};
        //     const user = (item.users && item.users[0]) || {};
        //     const docs = item.documents || {};
        //     return {
        //       id: item.id || safe(() => item._id),
        //       userName: safe(
        //         () => user.fullName,
        //         safe(() => customer.fullName, "-")
        //       ),
        //       email: safe(
        //         () => user.email,
        //         safe(() => customer.email, "-")
        //       ),
        //       submittedDate: safe(() => item.submittedAt, "-"),
        //       status: safe(() => item.status, "-"),
        //       documentType: safe(() => item.documentType, "-"),
        //       documents: {
        //         idFront: safe(() => docs.idFrontUrl, null),
        //         idBack: safe(() => docs.idBackUrl, null),
        //         selfie: safe(() => docs.selfieUrl, null),
        //         proofOfAddress: safe(() => docs.proofOfAddressUrl, null),
        //       },
        //       personalInfo: {
        //         fullName: safe(
        //           () => user.fullName,
        //           safe(() => customer.fullName, "-")
        //         ),
        //         dateOfBirth: safe(
        //           () => user.dateOfBirth,
        //           safe(() => customer.dateOfBirth, "-")
        //         ),
        //         idNumber: safe(
        //           () => user.idNumber,
        //           safe(() => customer.idNumber, "-")
        //         ),
        //         address: safe(
        //           () => user.address,
        //           safe(() => customer.address, "-")
        //         ),
        //         occupation: safe(
        //           () => user.occupation,
        //           safe(() => customer.occupation, "-")
        //         ),
        //       },
        //       reviewNotes: safe(() => item.reviewNotes, ""),
        //     };
        //   });
      }
      setKycApplications(mapped);
    } catch (err: any) {
      setError(err.message || "Failed to load KYC applications");
      console.error("Error fetching KYC applications:", err);
      // Always fallback to mock data if API fails
      // mapped = transformDbResponse(dbResponse);
      setKycApplications(mapped);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending review":
        return "bg-yellow-100 text-yellow-700";
      case "under review":
        return "bg-blue-100 text-blue-700";
      case "approved":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending review":
        return <Clock className="w-4 h-4" />;
      case "under review":
        return <Eye className="w-4 h-4" />;
      case "approved":
        return <Check className="w-4 h-4" />;
      case "rejected":
        return <X className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const updateApplicationStatus = (
    applicationId: string,
    status: string,
    reviewer: any
  ) => {
    setKycApplications((prevApplications) =>
      prevApplications.map((application) =>
        application.id === applicationId
          ? {
              ...application,
              status,
              reviewedBy: reviewer,
            }
          : application
      )
    );
  };

  // Approve KYC Application
  const handleApprove = async (application: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      if (!token)
        throw new Error("No authentication token found. Please log in.");
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
      console.log(response);
      if (response.ok) {
        const reviewer = {
          first_name: "Admin",
          last_name: "User",
          email: "admin@example.com",
        }; // Mock reviewer info
        // updateApplicationStatus(applicationId, "APPROVED", reviewer);
        setSelectedApplication(null); // Clear dialog state
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to approve application");
      }
    } catch (err: any) {
      setError(err.message || "Failed to approve application");
    } finally {
      setLoading(false);
    }
  };

  // Reject KYC Application
  const handleReject = async (applicationId: string, notes: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      if (!token)
        throw new Error("No authentication token found. Please log in.");
      const response = await fetch(`${API_BASE_URL}/${applicationId}/review`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "REJECTED",
          review_notes: notes,
        }),
      });
      if (response.ok) {
        const reviewer = {
          first_name: "Admin",
          last_name: "User",
          email: "admin@example.com",
        }; // Mock reviewer info
        updateApplicationStatus(applicationId, "REJECTED", reviewer);
        setSelectedApplication(null); // Clear dialog state
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reject application");
      }
    } catch (err: any) {
      setError(err.message || "Failed to reject application");
    } finally {
      setLoading(false);
    }
  };

  // Fetch detailed KYC document when Review button is clicked
  const fetchKYCDocumentDetails = async (documentId: string) => {
    console.log("🔍 Fetching KYC document details for ID:", documentId);
    setLoadingDetails(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("No authentication token found. Please log in.");
        setLoadingDetails(false);
        return;
      }
      const response = await fetch(`${API_BASE_URL}/${documentId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      let data: any = null;
      if (response.ok) {
        const apiData = await response.json();
        data = apiData.data || apiData;
      } else {
        setError("Failed to fetch KYC document details from API.");
        setLoadingDetails(false);
        return;
      }

      // Transform the detailed data for the dialog
      const customer: any = data.customer || {};
      const user: any = data.users || {};

      let userName = "-";
      let fullName = "-";
      if (customer && customer.first_name) {
        userName = `${customer.first_name} ${customer.last_name || ""}`.trim();
        fullName = userName;
      } else if (user && user.full_name) {
        userName = user.full_name;
        fullName = user.full_name;
      }

      const s3_urls: any = data.s3_urls || {};

      const detailedApplication = {
        id: data.id,
        application_id: data.application_id,
        userId: data.customer_id || data.user_id,
        userName: userName,
        email: customer.email || user.email || "-",
        submittedDate: data.created_at
          ? new Date(data.created_at).toLocaleDateString()
          : "-",
        status: data.status || "PENDING",
        documentType: data.document_type?.replace(/_/g, " ") || "Ghana Card",
        documents: {
          idFront:
            s3_urls.document_front_url || data.document_front_url || null,
          idBack: s3_urls.document_back_url || data.document_back_url || null,
          selfie: s3_urls.selfie_url || data.selfie_url || null,
          // proofOfAddress: s3_urls.proof_of_address_url || null,
        },
        personalInfo: {
          fullName: fullName,
          dateOfBirth: user.dob || "-",
          idNumber: "-",
          address: user.residential_address || "-",
          occupation: "-",
        },
        reviewNotes: data.review_notes || "",
        // reviewed_by may be present in the API response; normalize it here
        reviewedBy:
          data.reviewed_by || data.reviewedBy || data.reviewer || null,
      };

      console.log("Detailed KYC application data:", detailedApplication);

      setSelectedApplication(detailedApplication);
      setReviewNotes(detailedApplication.reviewNotes);
    } catch (err: any) {
      console.error("Error fetching KYC document details:", err);
      setError(err.message || "Failed to load KYC document details");
    } finally {
      setLoadingDetails(false);
    }
  };

  console.log(
    "KYCVerification component rendered",
    selectedApplication && selectedApplication
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">KYC Verification</h1>
          <p className="text-gray-600 mt-1">
            Review and verify customer identity documents
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">8</p>
            <p className="text-sm text-gray-600">Pending</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">12</p>
            <p className="text-sm text-gray-600">In Review</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">156</p>
            <p className="text-sm text-gray-600">Approved</p>
          </div>
        </div>
      </div>

      {/* KYC Applications Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                  Application ID
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                  User
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                  Document Type
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                  Submitted
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                  Reviewed By
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {kycApplications.map((application) => (
                <tr
                  key={application.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">
                    {/* Display UUID for clarity and correct API usage */}
                    {application.id}
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {application.userName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {application.email}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {application.documentType}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {application.submittedDate}
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      className={`${getStatusColor(
                        application.status
                      )} flex items-center space-x-1`}
                    >
                      {getStatusIcon(application.status)}
                      <span>{application.status}</span>
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {application.reviewedBy
                      ? `${application.reviewedBy.first_name || ""} ${
                          application.reviewedBy.last_name || ""
                        }`.trim() || application.reviewedBy.email
                      : "N/A"}
                  </td>
                  <td className="py-3 px-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Always use UUID for review details
                            fetchKYCDocumentDetails(application.id);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            KYC Review -{" "}
                            {selectedApplication?.userName ||
                              application.userName}
                          </DialogTitle>
                        </DialogHeader>
                        {loadingDetails ? (
                          <div className="flex justify-center items-center py-8">
                            <p className="text-gray-500">
                              Loading document details...
                            </p>
                          </div>
                        ) : (
                          selectedApplication && (
                            <div className="space-y-6">
                              {/* Personal Information */}
                              <div className="border rounded-lg p-4">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                  <User className="w-5 h-5 mr-2" />
                                  Personal Information
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">
                                      Full Name
                                    </label>
                                    <p className="text-sm text-gray-900">
                                      {
                                        selectedApplication.personalInfo
                                          .fullName
                                      }
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">
                                      Date of Birth
                                    </label>
                                    <p className="text-sm text-gray-900">
                                      {
                                        selectedApplication.personalInfo
                                          .dateOfBirth
                                      }
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">
                                      ID Number
                                    </label>
                                    <p className="text-sm text-gray-900">
                                      {
                                        selectedApplication.personalInfo
                                          .idNumber
                                      }
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">
                                      Occupation
                                    </label>
                                    <p className="text-sm text-gray-900">
                                      {
                                        selectedApplication.personalInfo
                                          .occupation
                                      }
                                    </p>
                                  </div>
                                  <div className="col-span-2">
                                    <label className="text-sm font-medium text-gray-600">
                                      Address
                                    </label>
                                    <p className="text-sm text-gray-900">
                                      {selectedApplication.personalInfo.address}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Document Review */}
                              <div className="border rounded-lg p-4">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                  <FileText className="w-5 h-5 mr-2" />
                                  Document Review
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-600">
                                      ID Front
                                    </label>
                                    {selectedApplication.documents.idFront ? (
                                      <img
                                        src={
                                          selectedApplication.documents.idFront
                                        }
                                        alt="ID Front"
                                        className="w-full h-40 object-cover border rounded-lg"
                                      />
                                    ) : (
                                      <span className="text-gray-400">
                                        Not Provided
                                      </span>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-600">
                                      ID Back
                                    </label>
                                    {selectedApplication.documents.idBack ? (
                                      <img
                                        src={
                                          selectedApplication.documents.idBack
                                        }
                                        alt="ID Back"
                                        className="w-full h-40 object-cover border rounded-lg"
                                      />
                                    ) : (
                                      <span className="text-gray-400">
                                        Not Provided
                                      </span>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-600">
                                      Selfie
                                    </label>
                                    {selectedApplication.documents.selfie ? (
                                      <img
                                        src={
                                          selectedApplication.documents.selfie
                                        }
                                        alt="Selfie"
                                        className="w-full h-40 object-cover border rounded-lg"
                                      />
                                    ) : (
                                      <span className="text-gray-400">
                                        Not Provided
                                      </span>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-600">
                                      Proof of Address
                                    </label>
                                    {selectedApplication.documents
                                      .proofOfAddress ? (
                                      <img
                                        src={
                                          selectedApplication.documents
                                            .proofOfAddress
                                        }
                                        alt="Proof of Address"
                                        className="w-full h-40 object-cover border rounded-lg"
                                      />
                                    ) : (
                                      <span className="text-gray-400">
                                        Not Provided
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Reviewed By */}
                              <div className="border rounded-lg p-4">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                  <User className="w-5 h-5 mr-2" />
                                  Reviewed By
                                </h3>
                                {selectedApplication.reviewedBy ? (
                                  <div className="space-y-1">
                                    <p className="text-sm text-gray-900 font-medium">
                                      {selectedApplication.reviewedBy
                                        .first_name || ""}{" "}
                                      {selectedApplication.reviewedBy
                                        .last_name || ""}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {selectedApplication.reviewedBy.email ||
                                        "-"}
                                    </p>
                                    {selectedApplication.reviewedBy.phone && (
                                      <p className="text-sm text-gray-500">
                                        {selectedApplication.reviewedBy.phone}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500">
                                    Not reviewed yet
                                  </p>
                                )}
                              </div>

                              {/* Review Notes */}
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-600">
                                  Review Notes
                                </label>
                                <Textarea
                                  value={reviewNotes}
                                  onChange={(e) =>
                                    setReviewNotes(e.target.value)
                                  }
                                  placeholder="Add notes about the verification..."
                                  rows={3}
                                />
                              </div>

                              {/* Action Buttons */}
                              <div className="flex justify-end space-x-3 pt-4 border-t">
                                <Button
                                  variant="outline"
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() =>
                                    handleReject(
                                      selectedApplication.id,
                                      reviewNotes
                                    )
                                  }
                                  disabled={
                                    loadingDetails ||
                                    loading ||
                                    !selectedApplication?.id
                                  }
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Reject Application
                                </Button>
                                <Button
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() =>
                                    handleApprove(selectedApplication?.id)
                                  }
                                  disabled={
                                    loadingDetails ||
                                    loading ||
                                    !selectedApplication?.id
                                  }
                                >
                                  <Check className="w-4 h-4 mr-2" />
                                  Approve Application
                                </Button>
                              </div>
                            </div>
                          )
                        )}
                      </DialogContent>
                    </Dialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
