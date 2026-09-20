import { createContext, useContext, useEffect, useState } from "react";

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

  const addComplaint = (complaint: any) => {
    setComplaints((prev) => [complaint, ...prev]);
  };

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

      if (data.success && data.complaint) {
        setComplaints((prev) =>
          prev.map((c) =>
            c._id === id ? data.complaint : c
          )
        );
      }
    } catch (error) {
      console.error("Failed to update complaint:", error);
    }
  };

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
          body: JSON.stringify({ assignedStaff }),
        }
      );

      const data = await response.json();

      if (data.success && data.complaint) {
        setComplaints((prev) =>
          prev.map((c) =>
            c._id === id ? data.complaint : c
          )
        );
      }
    } catch (error) {
      console.error("Failed to reassign complaint:", error);
    }
  };

  const getComplaintsByUser = (userId: string) => {
    return complaints.filter(
      (complaint) => complaint.userId === userId
    );
  };

  const getComplaintsByDepartment = (department: string) => {
    return complaints.filter(
      (complaint) => complaint.department === department
    );
  };

  const getComplaintsByStatus = (status: string) => {
    return complaints.filter(
      (complaint) => complaint.status === status
    );
  };

  const getComplaintsByStaff = (staffEmail: string) => {
    return complaints.filter(
      (complaint) => complaint.assignedStaff === staffEmail
    );
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

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

export const useComplaints = () => {
  const context = useContext(ComplaintContext);

  if (!context) {
    throw new Error(
      "useComplaints must be used within ComplaintProvider"
    );
  }

  return context;
};
