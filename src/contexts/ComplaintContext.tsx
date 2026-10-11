
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const ComplaintContext = createContext<any>(null);

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

export const ComplaintProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // FETCH ALL COMPLAINTS
  const fetchComplaints = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/complaints`);

      if (!response.ok) {
        throw new Error("Failed to fetch complaints");
      }

      const data = await response.json();
      setComplaints(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch complaints:", error);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  // CREATE AND SAVE A COMPLAINT WITH A MANDATORY PHOTO
  const createComplaint = async (complaint: any) => {
    try {
      // Validate mandatory fields
      if (!complaint.description?.trim()) {
        return {
          success: false,
          message: "Please enter a complaint description.",
        };
      }

      if (
        typeof complaint.photo === "undefined" ||
        !(complaint.photo instanceof File)
      ) {
        return {
          success: false,
          message: "Please attach a photo of the civic issue.",
        };
      }

      if (!complaint.photo.type.startsWith("image/")) {
        return {
          success: false,
          message: "Please select a valid image file.",
        };
      }

      // FormData allows the browser to upload the actual image file.
      const formData = new FormData();

      Object.entries({
        ...complaint,
        address: complaint.address ?? "",
        latitude: complaint.latitude ?? "",
        longitude: complaint.longitude ?? "",
        locationSource: complaint.locationSource ?? "",
        locationAccuracy: complaint.locationAccuracy ?? "",
      }).forEach(([key, value]) => {
        if (key === "photo" || value === undefined || value === null) {
          return;
        }

        if (typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });

      // The backend must use upload.single("photo").
      formData.append("photo", complaint.photo);

      const response = await fetch(`${API_BASE}/complaint`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to create complaint"
        );
      }

      const savedComplaint = data.complaint ?? data;

      if (savedComplaint?._id || savedComplaint?.id) {
        setComplaints((prev) => {
          const id = savedComplaint._id ?? savedComplaint.id;

          if (
            prev.some(
              (item) => (item._id ?? item.id) === id
            )
          ) {
            return prev;
          }

          return [savedComplaint, ...prev];
        });
      } else {
        await fetchComplaints();
      }

      return {
        success: true,
        complaint: savedComplaint,
        message: data.message || "Complaint submitted successfully.",
      };
    } catch (error) {
      console.error("Failed to create complaint:", error);

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create complaint",
      };
    }
  };

  // ADD AN ALREADY-SAVED COMPLAINT TO LOCAL STATE
  const addComplaint = (complaint: any) => {
    setComplaints((prev) => {
      const id = complaint?._id ?? complaint?.id;

      if (
        id &&
        prev.some((item) => (item._id ?? item.id) === id)
      ) {
        return prev;
      }

      return [complaint, ...prev];
    });
  };

  // UPDATE COMPLAINT STATUS
  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(
        `${API_BASE}/complaints/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to update complaint status"
        );
      }

      if (data.success && data.complaint) {
        setComplaints((prev) =>
          prev.map((complaint) =>
            complaint._id === id ? data.complaint : complaint
          )
        );
      }

      return data;
    } catch (error) {
      console.error("Failed to update complaint status:", error);

      return {
        success: false,
        message: "Failed to update complaint status",
      };
    }
  };

  // REASSIGN COMPLAINT TO STAFF
  const reassignComplaint = async (
    id: string,
    assignedStaff: string
  ) => {
    try {
      const response = await fetch(`${API_BASE}/complaints/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assignedStaff }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to reassign complaint"
        );
      }

      if (data.success && data.complaint) {
        setComplaints((prev) =>
          prev.map((complaint) =>
            complaint._id === id ? data.complaint : complaint
          )
        );
      }

      return data;
    } catch (error) {
      console.error("Failed to reassign complaint:", error);

      return {
        success: false,
        message: "Failed to reassign complaint",
      };
    }
  };

  // FILTER COMPLAINTS
  const getComplaintsByUser = (userId: string) =>
    complaints.filter(
      (complaint) =>
        String(complaint.userId) === String(userId)
    );

  const getComplaintsByDepartment = (department: string) =>
    complaints.filter(
      (complaint) =>
        complaint.department?.toLowerCase() ===
        department?.toLowerCase()
    );

  const getComplaintsByStatus = (status: string) =>
    complaints.filter(
      (complaint) =>
        complaint.status?.toLowerCase() === status?.toLowerCase()
    );

  const getComplaintsByStaff = (staffEmail: string) =>
    complaints.filter(
      (complaint) =>
        complaint.assignedStaff?.toLowerCase() ===
        staffEmail?.toLowerCase()
    );

  useEffect(() => {
    void fetchComplaints();
  }, []);

  return (
    <ComplaintContext.Provider
      value={{
        complaints,
        setComplaints,
        addComplaint,
        createComplaint,
        fetchComplaints,
        updateStatus,
        reassignComplaint,
        getComplaintsByUser,
        getComplaintsByDepartment,
        getComplaintsByStatus,
        getComplaintsByStaff,
        loading,
      }}
    >
      {children}
    </ComplaintContext.Provider>
  );
};

export const useComplaints = () => {
  const context = useContext(ComplaintContext);

  if (!context) {
    throw new Error(
      "useComplaints must be used within ComplaintProvider"
    );
  }

  return context;
};
