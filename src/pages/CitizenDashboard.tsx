import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Clock3,
  AlertCircle,
  CheckCircle,
  Plus,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import EmergencyButton from "@/components/EmergencyButton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useComplaints } from "@/contexts/ComplaintContext";

export default function CitizenDashboard() {
  const { user } = useAuth();
  const { complaints, loading, fetchComplaints } = useComplaints();

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Match complaints belonging to the logged-in citizen.
  // Supports both old complaints and new complaints.
  const myComplaints = complaints.filter((complaint: any) => {
    const userId = String(user?.id || user?._id || "").trim();
    const userEmail = String(user?.email || "").trim().toLowerCase();
    const userName = String(user?.name || "").trim().toLowerCase();

    const complaintUserId = String(complaint.userId || "").trim();
    const complaintUserEmail = String(
      complaint.userEmail || ""
    )
      .trim()
      .toLowerCase();
    const complaintUserName = String(
      complaint.userName || ""
    )
      .trim()
      .toLowerCase();

    // New complaints: match by ID
    if (userId && complaintUserId && complaintUserId === userId) {
      return true;
    }

    // New complaints: match by email
    if (
      userEmail &&
      complaintUserEmail &&
      complaintUserEmail === userEmail
    ) {
      return true;
    }

    // Old complaints: fallback to name
    if (userName && complaintUserName && complaintUserName === userName) {
      return true;
    }

    return false;
  });

  const totalCount = myComplaints.length;

  const pendingCount = myComplaints.filter(
    (c: any) => c.status?.toLowerCase() === "pending"
  ).length;

  const inProgressCount = myComplaints.filter(
    (c: any) =>
      c.status?.toLowerCase() === "in progress" ||
      c.status?.toLowerCase() === "in-progress"
  ).length;

  const resolvedCount = myComplaints.filter(
    (c: any) => c.status?.toLowerCase() === "resolved"
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-4xl font-bold text-foreground">
            My Complaints
          </h1>

          <Link to="/report">
            <Button className="flex items-center gap-2 rounded-xl bg-primary px-6 py-6 text-lg text-primary-foreground hover:bg-primary/90">
              <Plus className="h-5 w-5" />
              Report Issue
            </Button>
          </Link>
        </div>

        {/* Statistics */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <FileText className="mb-3 h-8 w-8 text-primary" />

              <h2 className="text-4xl font-bold">
                {totalCount}
              </h2>

              <p className="mt-2 text-muted-foreground">
                Total
              </p>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="mb-3 h-8 w-8 text-red-500" />

              <h2 className="text-4xl font-bold">
                {pendingCount}
              </h2>

              <p className="mt-2 text-muted-foreground">
                Pending
              </p>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <Clock3 className="mb-3 h-8 w-8 text-yellow-500" />

              <h2 className="text-4xl font-bold">
                {inProgressCount}
              </h2>

              <p className="mt-2 text-muted-foreground">
                In Progress
              </p>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <CheckCircle className="mb-3 h-8 w-8 text-green-500" />

              <h2 className="text-4xl font-bold">
                {resolvedCount}
              </h2>

              <p className="mt-2 text-muted-foreground">
                Resolved
              </p>
            </div>
          </div>
        </div>

        {/* Complaints */}
        <div className="min-h-[340px] rounded-2xl border bg-card p-8 shadow-sm">
          {loading ? (
            <div className="flex h-[260px] items-center justify-center">
              <p className="text-lg text-muted-foreground">
                Loading complaints...
              </p>
            </div>
          ) : myComplaints.length === 0 ? (
            <div className="flex h-[260px] flex-col items-center justify-center text-center">
              <FileText className="mb-4 h-16 w-16 text-muted-foreground" />

              <p className="mb-3 text-3xl font-semibold text-foreground">
                No complaints yet.
              </p>

              <Link to="/report">
                <Button className="rounded-xl px-6 py-5 text-lg">
                  Report your first issue
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myComplaints.map((complaint: any) => (
                <div
                  key={complaint._id}
                  className="rounded-xl border bg-background p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:justify-between">
                    <div className="flex-1">
                      <h2 className="mb-2 text-xl font-bold">
                        {complaint.category}
                      </h2>

                      <p className="mb-4 text-muted-foreground">
                        {complaint.description}
                      </p>

                      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                        <p>
                          <span className="font-semibold">
                            Status:
                          </span>{" "}
                          {complaint.status}
                        </p>

                        <p>
                          <span className="font-semibold">
                            Priority:
                          </span>{" "}
                          {complaint.priority}
                        </p>

                        <p>
                          <span className="font-semibold">
                            Department:
                          </span>{" "}
                          {complaint.department || "Not assigned"}
                        </p>

                        <p>
                          <span className="font-semibold">
                            Reported On:
                          </span>{" "}
                          {complaint.createdAt
                            ? new Date(
                                complaint.createdAt
                              ).toLocaleString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    {complaint.imageUrl && (
                      <img
                        src={complaint.imageUrl}
                        alt="Complaint"
                        className="h-32 w-full rounded-xl border object-cover md:w-48"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <EmergencyButton />
    </div>
  );
}
