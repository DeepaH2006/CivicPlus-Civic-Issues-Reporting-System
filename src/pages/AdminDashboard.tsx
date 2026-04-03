import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Search,
  BarChart3,
  MapPin,
  Users,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import EmergencyButton from "@/components/EmergencyButton";
import MapView from "@/components/MapView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useComplaints } from "@/contexts/ComplaintContext";

const staffOptions = [
  "Priya (Sanitation)",
  "Arun (Water)",
  "Kumar (Roads)",
  "Lakshmi (Electrical)",
  "Suresh (General)",
];

const staffEmailMap: Record<string, string> = {
  "Priya (Sanitation)": "garbage@gmail.com",
  "Arun (Water)": "water@gmail.com",
  "Kumar (Roads)": "road@gmail.com",
  "Lakshmi (Electrical)": "electrical@gmail.com",
  "Suresh (General)": "",
};

export default function AdminDashboard() {
  const { complaints, fetchComplaints, loading, setComplaints } = useComplaints();

  const [view, setView] = useState<"map" | "analytics">("analytics");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");

  useEffect(() => {
    fetchComplaints();
  }, []);

  const totalCount = complaints.length;
  const pendingCount = complaints.filter(
    (c: any) => c.status?.toLowerCase() === "pending"
  ).length;
  const inProgressCount = complaints.filter(
    (c: any) =>
      c.status?.toLowerCase() === "in progress" ||
      c.status?.toLowerCase() === "in-progress"
  ).length;
  const resolvedCount = complaints.filter(
    (c: any) => c.status?.toLowerCase() === "resolved"
  ).length;

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c: any) => {
      const matchesSearch =
        !search ||
        c.category?.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase()) ||
        c.department?.toLowerCase().includes(search.toLowerCase()) ||
        c.userName?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All Status" || c.status === statusFilter;

      const matchesCategory =
        categoryFilter === "All Categories" || c.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [complaints, search, statusFilter, categoryFilter]);

  const workload = [
    {
      name: "Arun (Water)",
      count: complaints.filter((c: any) => c.assignedStaff === "water@gmail.com").length,
    },
    {
      name: "Priya (Sanitation)",
      count: complaints.filter((c: any) => c.assignedStaff === "garbage@gmail.com").length,
    },
    {
      name: "Kumar (Roads)",
      count: complaints.filter((c: any) => c.assignedStaff === "road@gmail.com").length,
    },
    {
      name: "Lakshmi (Electrical)",
      count: complaints.filter((c: any) => c.assignedStaff === "electrical@gmail.com").length,
    },
    {
      name: "Suresh (General)",
      count: complaints.filter((c: any) => !c.assignedStaff).length,
    },
  ];

  const updateComplaint = async (id: string, updates: any) => {
    try {
      const API_BASE =
        window.location.hostname === "localhost"
          ? "http://localhost:5000"
          : `http://${window.location.hostname}:5000`;

      const res = await fetch(`${API_BASE}/complaints/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        throw new Error("Failed to update complaint");
      }

      const data = await res.json();

      setComplaints((prev: any[]) =>
        prev.map((item: any) => (item._id === id ? data.complaint : item))
      );
    } catch (error) {
      console.error("Complaint update failed:", error);
    }
  };

  const handleAssign = (id: string, staffName: string) => {
    const assignedStaff = staffEmailMap[staffName] ?? "";
    updateComplaint(id, { assignedStaff });
  };

  const handleStatusChange = (id: string, status: string) => {
    updateComplaint(id, { status });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>

          <div className="flex gap-3">
            <Button
              onClick={() => setView("map")}
              className={`rounded-xl ${
                view === "map" ? "" : "bg-muted text-foreground hover:bg-muted/80"
              }`}
            >
              <MapPin className="mr-2 h-4 w-4" />
              Map
            </Button>
            <Button
              onClick={() => setView("analytics")}
              className={`rounded-xl ${
                view === "analytics"
                  ? ""
                  : "bg-muted text-foreground hover:bg-muted/80"
              }`}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
            <FileText className="mx-auto mb-3 h-8 w-8 text-primary" />
            <h2 className="text-4xl font-bold">{totalCount}</h2>
            <p className="mt-2 text-muted-foreground">Total</p>
          </div>

          <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
            <Clock3 className="mx-auto mb-3 h-8 w-8 text-red-500" />
            <h2 className="text-4xl font-bold">{pendingCount}</h2>
            <p className="mt-2 text-muted-foreground">Pending</p>
          </div>

          <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-yellow-500" />
            <h2 className="text-4xl font-bold">{inProgressCount}</h2>
            <p className="mt-2 text-muted-foreground">In Progress</p>
          </div>

          <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
            <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-green-500" />
            <h2 className="text-4xl font-bold">{resolvedCount}</h2>
            <p className="mt-2 text-muted-foreground">Resolved</p>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold">
            <Users className="h-5 w-5" />
            Staff Workload
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
            {workload.map((staff) => (
              <div
                key={staff.name}
                className="rounded-2xl bg-muted p-5 text-center"
              >
                <p className="text-lg">{staff.name}</p>
                <h3 className="mt-2 text-4xl font-bold">{staff.count}</h3>
                <p className="text-muted-foreground">active</p>
              </div>
            ))}
          </div>
        </div>

        {view === "map" && (
          <div className="mb-8 rounded-2xl border bg-card p-4 shadow-sm">
            <MapView
              complaints={complaints.map((c: any) => ({
                ...c,
                lat: c.latitude,
                long: c.longitude,
              }))}
              height="360px"
              center={[13.0827, 80.2707]}
              zoom={12}
            />
          </div>
        )}

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-14 rounded-xl pl-12 text-lg"
                placeholder="Search complaints..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="h-14 rounded-xl border bg-background px-4 text-lg"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>All Status</option>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Resolved</option>
            </select>

            <select
              className="h-14 rounded-xl border bg-background px-4 text-lg"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option>All Categories</option>
              <option>Garbage</option>
              <option>Pothole</option>
              <option>Streetlight</option>
              <option>Water Issue</option>
              <option>Others</option>
            </select>
          </div>

          {loading ? (
            <div className="py-8 text-center">Loading complaints...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-lg">
                    <th className="px-4">ID</th>
                    <th className="px-4">Category</th>
                    <th className="px-4">Description</th>
                    <th className="px-4">Status</th>
                    <th className="px-4">Priority</th>
                    <th className="px-4">Dept</th>
                    <th className="px-4">Assigned To</th>
                    <th className="px-4">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredComplaints.map((complaint: any, index: number) => (
                    <tr
                      key={complaint._id}
                      className={index % 2 === 0 ? "bg-card" : "bg-muted/30"}
                    >
                      <td className="rounded-l-xl px-4 py-4 font-medium">
                        {complaint._id?.slice(-6).toUpperCase() || "CMP"}
                      </td>
                      <td className="px-4 py-4">{complaint.category}</td>
                      <td className="px-4 py-4">{complaint.description}</td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-red-100 px-3 py-1 font-semibold text-red-500">
                          {complaint.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-red-100 px-3 py-1 font-semibold text-red-500">
                          {complaint.priority}
                        </span>
                      </td>
                      <td className="px-4 py-4">{complaint.department}</td>
                      <td className="px-4 py-4">
                        <select
                          className="rounded-lg border bg-background px-3 py-2"
                          value={
                            Object.keys(staffEmailMap).find(
                              (key) => staffEmailMap[key] === complaint.assignedStaff
                            ) || "Suresh (General)"
                          }
                          onChange={(e) =>
                            handleAssign(complaint._id, e.target.value)
                          }
                        >
                          {staffOptions.map((staff) => (
                            <option key={staff}>{staff}</option>
                          ))}
                        </select>
                      </td>
                      <td className="rounded-r-xl px-4 py-4">
                        <select
                          className="rounded-lg border bg-background px-3 py-2"
                          value={complaint.status}
                          onChange={(e) =>
                            handleStatusChange(complaint._id, e.target.value)
                          }
                        >
                          <option>Pending</option>
                          <option>In Progress</option>
                          <option>Resolved</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <EmergencyButton />
    </div>
  );
}