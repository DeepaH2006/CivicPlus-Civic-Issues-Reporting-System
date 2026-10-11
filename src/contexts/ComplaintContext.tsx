
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

  // CREATE AND SAVE A COMPLAINT
  const createComplaint = async (complaint: any) => {
    try {
      const response = await fetch(`${API_BASE}/complaints`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...complaint,
          address: complaint.address ?? "",
          lat: complaint.lat ?? null,
          long: complaint.long ?? null,
          locationSource: complaint.locationSource ?? "manual",
          locationAccuracy: complaint.locationAccuracy ?? null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to create complaint"
        );
      }

      const savedComplaint = data.complaint ?? data;

      if (savedComplaint && (savedComplaint._id || savedComplaint.id)) {
        setComplaints((prev) => {
          const id = savedComplaint._id ?? savedComplaint.id;

          if (
            prev.some(
              (item) =>
                (item._id ?? item.id) === id
            )
          ) {
            return prev;
          }

          return [savedComplaint, ...prev];
        });
      } else {
        // If the API uses a different success response format,
        // reload the list to obtain the saved record.
        await fetchComplaints();
      }

      return {
        success: true,
        complaint: savedComplaint,
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
      if (
        complaint?._id &&
        prev.some((c) => c._id === complaint._id)
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
        complaint.userId === userId ||
        complaint.userId === String(userId)
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
