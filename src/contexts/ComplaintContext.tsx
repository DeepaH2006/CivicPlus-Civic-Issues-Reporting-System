import { createContext, useContext, useEffect, useState } from "react";

const ComplaintContext = createContext<any>(null);

// Backend API URL
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

  // ==========================================
  // FETCH ALL COMPLAINTS
  // ==========================================
  const fetchComplaints = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/complaints`);

      if (!response.ok) {
        throw new Error("Failed to fetch complaints");
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setComplaints(data);
      } else {
        setComplaints([]);
      }
    } catch (error) {
      console.error("Failed to fetch complaints:", error);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // ADD NEW COMPLAINT
  // ==========================================
  const addComplaint = (complaint: any) => {
    setComplaints((prev) => {
      // Prevent duplicate complaint
      if (
        complaint?._id &&
        prev.some((c) => c._id === complaint._id)
      ) {
        return prev;
      }

      return [complaint, ...prev];
    });
  };

  // ==========================================
  // UPDATE COMPLAINT STATUS
  // ==========================================
  const updateStatus = async (
    id: string,
    status: string
  ) => {
    try {
      const response = await fetch(
        `${API_BASE}/complaints/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
          }),
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
            complaint._id === id
              ? data.complaint
              : complaint
          )
        );
      }

      return data;
    } catch (error) {
      console.error(
        "Failed to update complaint status:",
        error
      );

      return {
        success: false,
        message: "Failed to update complaint status",
      };
    }
  };

  // ==========================================
  // REASSIGN COMPLAINT TO STAFF
  // ==========================================
  const reassignComplaint = async (
    id: string,
    assignedStaff: string
  ) => {
    try {
      const response = await fetch(
        `${API_BASE}/complaints/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assignedStaff,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to reassign complaint"
        );
      }

      if (data.success && data.complaint) {
        setComplaints((prev) =>
          prev.map((complaint) =>
            complaint._id === id
              ? data.complaint
              : complaint
          )
        );
      }

      return data;
    } catch (error) {
      console.error(
        "Failed to reassign complaint:",
        error
      );

      return {
        success: false,
        message: "Failed to reassign complaint",
      };
    }
  };

  // ==========================================
  // GET COMPLAINTS BY USER
  // ==========================================
  const getComplaintsByUser = (userId: string) => {
    return complaints.filter(
      (complaint) =>
        complaint.userId === userId ||
        complaint.userId === String(userId)
    );
  };

  // ==========================================
  // GET COMPLAINTS BY DEPARTMENT
  // ==========================================
  const getComplaintsByDepartment = (
    department: string
  ) => {
    return complaints.filter(
      (complaint) =>
        complaint.department?.toLowerCase() ===
        department?.toLowerCase()
    );
  };

  // ==========================================
  // GET COMPLAINTS BY STATUS
  // ==========================================
  const getComplaintsByStatus = (
    status: string
  ) => {
    return complaints.filter(
      (complaint) =>
        complaint.status?.toLowerCase() ===
        status?.toLowerCase()
    );
  };

  // ==========================================
  // GET COMPLAINTS BY STAFF
  // ==========================================
  const getComplaintsByStaff = (
    staffEmail: string
  ) => {
    return complaints.filter(
      (complaint) =>
        complaint.assignedStaff?.toLowerCase() ===
        staffEmail?.toLowerCase()
    );
  };

  // ==========================================
  // FETCH COMPLAINTS WHEN APP LOADS
  // ==========================================
  useEffect(() => {
    fetchComplaints();
  }, []);

  // ==========================================
  // CONTEXT PROVIDER
  // ==========================================
  return (
    <ComplaintContext.Provider
      value={{
        complaints,
        setComplaints,

        addComplaint,
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

// ==========================================
// CUSTOM HOOK
// ==========================================
export const useComplaints = () => {
  const context = useContext(ComplaintContext);

  if (!context) {
    throw new Error(
      "useComplaints must be used within ComplaintProvider"
    );
  }

  return context;
};
