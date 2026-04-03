import { useComplaints } from '@/contexts/ComplaintContext';
import Navbar from '@/components/Navbar';
import EmergencyButton from '@/components/EmergencyButton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#1e3a5f', '#f59e0b', '#22c55e', '#ef4444', '#6366f1'];

export default function AnalyticsPage() {
  const { complaints } = useComplaints();

  // Category chart
  const categoryData = ['Garbage', 'Pothole', 'Streetlight', 'Water Issue', 'Others'].map(cat => ({
    name: cat,
    count: complaints.filter(c => c.category === cat).length,
  }));

  // Status distribution
  const statusData = [
    { name: 'Pending', value: complaints.filter(c => c.status === 'Pending').length },
    { name: 'In Progress', value: complaints.filter(c => c.status === 'In Progress').length },
    { name: 'Resolved', value: complaints.filter(c => c.status === 'Resolved').length },
  ];
  const statusColors = ['#ef4444', '#f59e0b', '#22c55e'];

  // Department distribution
  const departments = [...new Set(complaints.map(c => c.department))];
  const deptData = departments.map(d => ({
    name: d,
    count: complaints.filter(c => c.department === d).length,
  }));

  // Priority
  const priorityData = [
    { name: 'Normal', value: complaints.filter(c => c.priority === 'Normal').length },
    { name: 'High', value: complaints.filter(c => c.priority === 'High').length },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-6 px-4">
        <h1 className="font-heading text-2xl font-bold mb-6 text-foreground">Analytics Dashboard</h1>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Category Bar Chart */}
          <div className="bg-card rounded-xl border p-4">
            <h3 className="font-heading font-semibold mb-4 text-foreground">Complaints by Category</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(215 15% 50%)' }} />
                <YAxis tick={{ fill: 'hsl(215 15% 50%)' }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(212 55% 25%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status Pie */}
          <div className="bg-card rounded-xl border p-4">
            <h3 className="font-heading font-semibold mb-4 text-foreground">Status Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                  {statusData.map((_, i) => <Cell key={i} fill={statusColors[i]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Department Bar */}
          <div className="bg-card rounded-xl border p-4">
            <h3 className="font-heading font-semibold mb-4 text-foreground">By Department</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={deptData} layout="vertical">
                <XAxis type="number" tick={{ fill: 'hsl(215 15% 50%)' }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fill: 'hsl(215 15% 50%)' }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(38 92% 50%)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Priority */}
          <div className="bg-card rounded-xl border p-4">
            <h3 className="font-heading font-semibold mb-4 text-foreground">Priority Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={priorityData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                  <Cell fill="hsl(212 55% 25%)" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <EmergencyButton />
    </div>
  );
}
