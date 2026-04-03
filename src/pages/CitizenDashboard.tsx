import { useEffect } from "react";
import { Link } from "react-router-dom";
import { FileText, Clock3, AlertCircle, CheckCircle, Plus } from "lucide-react";
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

  const myComplaints = complaints.filter(
    (complaint: any) =>
      complaint.userId === user?.id || complaint.userName === user?.name
  );

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

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-4xl font-bold text-foreground">My Complaints</h1>

          <Link to="/report">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 py-6 text-lg flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Report Issue
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 mb-8">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <FileText className="h-8 w-8 text-primary mb-3" />
              <h2 className="text-4xl font-bold">{totalCount}</h2>
              <p className="text-muted-foreground mt-2">Total</p>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mb-3" />
              <h2 className="text-4xl font-bold">{pendingCount}</h2>
              <p className="text-muted-foreground mt-2">Pending</p>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <Clock3 className="h-8 w-8 text-yellow-500 mb-3" />
              <h2 className="text-4xl font-bold">{inProgressCount}</h2>
              <p className="text-muted-foreground mt-2">In Progress</p>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <CheckCircle className="h-8 w-8 text-green-500 mb-3" />
              <h2 className="text-4xl font-bold">{resolvedCount}</h2>
              <p className="text-muted-foreground mt-2">Resolved</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card shadow-sm min-h-[340px] p-8">
          {loading ? (
            <div className="flex h-[260px] items-center justify-center">
              <p className="text-lg text-muted-foreground">Loading complaints...</p>
            </div>
          ) : myComplaints.length === 0 ? (
            <div className="flex h-[260px] flex-col items-center justify-center text-center">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-3xl font-semibold text-foreground mb-3">
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
                  className="rounded-xl border p-5 bg-background"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:justify-between">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold mb-2">
                        {complaint.category}
                      </h2>
                      <p className="text-muted-foreground mb-4">
                        {complaint.description}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <p>
                          <span className="font-semibold">Status:</span>{" "}
                          {complaint.status}
                        </p>
                        <p>
                          <span className="font-semibold">Priority:</span>{" "}
                          {complaint.priority}
                        </p>
                        <p>
                          <span className="font-semibold">Department:</span>{" "}
                          {complaint.department || "Not assigned"}
                        </p>
                        <p>
                          <span className="font-semibold">Reported On:</span>{" "}
                          {complaint.createdAt
                            ? new Date(complaint.createdAt).toLocaleString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    {complaint.imageUrl && (
                      <img
                        src={complaint.imageUrl}
                        alt="Complaint"
                        className="h-32 w-full md:w-48 rounded-xl object-cover border"
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