import { useEffect, useMemo, useState } from "react";
import {
  User,
  Briefcase,
  Play,
  CheckCircle2,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import EmergencyButton from "@/components/EmergencyButton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useComplaints } from "@/contexts/ComplaintContext";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

export default function FieldStaffDashboard() {
  const { user } = useAuth();

  const {
    complaints,
    fetchComplaints,
    loading,
    setComplaints,
  } = useComplaints();

  const [tab, setTab] = useState<
    "active" | "assigned" | "resolved"
  >("active");

  useEffect(() => {
    fetchComplaints();
  }, []);

  /*
   * Get complaints assigned to the currently
   * logged-in field staff member.
   */
  const assignedComplaints = useMemo(() => {
    const staffEmail = String(user?.email || "")
      .trim()
      .toLowerCase();

    return complaints.filter((complaint: any) => {
      const assignedStaff = String(
        complaint.assignedStaff || ""
      )
        .trim()
        .toLowerCase();

      return (
        staffEmail !== "" &&
        assignedStaff === staffEmail
      );
    });
  }, [complaints, user]);

  const totalCount = assignedComplaints.length;

  const pendingComplaints = assignedComplaints.filter(
    (c: any) =>
      c.status?.toLowerCase() === "pending"
  );

  const activeComplaints = assignedComplaints.filter(
    (c: any) =>
      c.status?.toLowerCase() === "in progress" ||
      c.status?.toLowerCase() === "in-progress"
  );

  const resolvedComplaints = assignedComplaints.filter(
    (c: any) =>
      c.status?.toLowerCase() === "resolved"
  );

  const pendingCount = pendingComplaints.length;
  const activeCount = activeComplaints.length;
  const resolvedCount = resolvedComplaints.length;

  /*
   * Active tab:
   * Show active complaints first.
   * If there are no active complaints,
   * show pending assigned complaints.
   */
  const filteredComplaints =
    tab === "assigned"
      ? pendingComplaints
      : tab === "active"
      ? activeComplaints.length > 0
        ? activeComplaints
        : pendingComplaints
      : resolvedComplaints;

  /*
   * Update complaint status.
   */
  const updateStatus = async (
    id: string,
    newStatus: string
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
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update status"
        );
      }

      if (data.success && data.complaint) {
        setComplaints((prev: any[]) =>
          prev.map((item: any) =>
            item._id === id
              ? data.complaint
              : item
          )
        );
      }
    } catch (error) {
      console.error(
        "Status update failed:",
        error
      );
    }
  };

  /*
   * Display department based on staff email.
   */
  const staffEmail = String(user?.email || "")
    .trim()
    .toLowerCase();

  const departmentLabel =
    staffEmail === "water@gmail.com"
      ? "Water Supply"
      : staffEmail === "garbage@gmail.com"
      ? "Sanitation"
      : staffEmail === "road@gmail.com"
      ? "Road Maintenance"
      : staffEmail === "electrical@gmail.com"
      ? "Electrical"
      : "General";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto max-w-7xl px-4 py-8">

        {/* Header */}
        <div className="mb-8 flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <User className="h-8 w-8 text-primary" />
          </div>

          <div>
            <h1 className="text-4xl font-bold text-foreground">
              {user?.name || "Field Staff"}
            </h1>

            <p className="mt-1 flex items-center gap-2 text-lg text-muted-foreground">
              <Briefcase className="h-4 w-4" />
              {departmentLabel}
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
            <h2 className="text-4xl font-bold text-primary">
              {totalCount}
            </h2>

            <p className="mt-2 text-muted-foreground">
              Total
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
            <h2 className="text-4xl font-bold text-red-500">
              {pendingCount}
            </h2>

            <p className="mt-2 text-muted-foreground">
              Pending
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
            <h2 className="text-4xl font-bold text-yellow-500">
              {activeCount}
            </h2>

            <p className="mt-2 text-muted-foreground">
              Active
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
            <h2 className="text-4xl font-bold text-green-500">
              {resolvedCount}
            </h2>

            <p className="mt-2 text-muted-foreground">
              Resolved
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Button
            onClick={() => setTab("active")}
            className={`rounded-xl px-6 ${
              tab === "active"
                ? ""
                : "bg-muted text-foreground hover:bg-muted/80"
            }`}
          >
            Active
          </Button>

          <Button
            onClick={() => setTab("assigned")}
            className={`rounded-xl px-6 ${
              tab === "assigned"
                ? ""
                : "bg-muted text-foreground hover:bg-muted/80"
            }`}
          >
            Assigned
          </Button>

          <Button
            onClick={() => setTab("resolved")}
            className={`rounded-xl px-6 ${
              tab === "resolved"
                ? ""
                : "bg-muted text-foreground hover:bg-muted/80"
            }`}
          >
            Resolved
          </Button>
        </div>

        {/* Complaints */}
        {loading ? (
          <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
            Loading tasks...
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
            <p className="text-lg text-muted-foreground">
              No tasks found.
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Logged in as: {user?.email || "Unknown"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComplaints.map(
              (complaint: any) => (
                <div
                  key={complaint._id}
                  className="rounded-2xl border bg-card p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 md:flex-row">

                    {complaint.imageUrl && (
                      <img
                        src={complaint.imageUrl}
                        alt="Complaint"
                        className="h-28 w-28 rounded-2xl border object-cover"
                      />
                    )}

                    <div className="flex-1">

                      <div className="mb-2 flex flex-wrap items-center gap-3">

                        <span className="text-sm text-muted-foreground">
                          {complaint._id
                            ?.slice(-6)
                            .toUpperCase() ||
                            "CMP004"}
                        </span>

                        <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-500">
                          {complaint.status}
                        </span>

                        <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-500">
                          {complaint.priority}
                        </span>

                      </div>

                      <h3 className="mb-2 text-2xl font-medium">
                        {complaint.description}
                      </h3>

                      <p className="text-lg text-muted-foreground">
                        {departmentLabel} •{" "}
                        {complaint.category} • by{" "}
                        {complaint.userName}
                      </p>

                      <p className="mt-2 text-sm text-muted-foreground">
                        Assigned to:{" "}
                        {complaint.assignedStaff}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-3">

                        {complaint.status?.toLowerCase() ===
                          "pending" && (
                          <Button
                            className="rounded-xl px-6 py-5 text-lg"
                            onClick={() =>
                              updateStatus(
                                complaint._id,
                                "In Progress"
                              )
                            }
                          >
                            <Play className="mr-2 h-5 w-5" />
                            Accept
                          </Button>
                        )}

                        {(complaint.status?.toLowerCase() ===
                          "in progress" ||
                          complaint.status?.toLowerCase() ===
                            "in-progress") && (
                          <Button
                            className="rounded-xl bg-green-600 px-6 py-5 text-lg hover:bg-green-700"
                            onClick={() =>
                              updateStatus(
                                complaint._id,
                                "Resolved"
                              )
                            }
                          >
                            <CheckCircle2 className="mr-2 h-5 w-5" />
                            Mark Resolved
                          </Button>
                        )}

                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      <EmergencyButton />
    </div>
  );
}
