export type Role = 'Citizen' | 'Admin' | 'Field Staff';
export type Status = 'Pending' | 'In Progress' | 'Resolved';
export type Priority = 'Normal' | 'High';
export type Category = 'Garbage' | 'Pothole' | 'Streetlight' | 'Water Issue' | 'Others';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  department?: string;
}

export interface HistoryEntry {
  timestamp: string;
  status: Status;
  note: string;
  updatedBy: string;
}

export interface Complaint {
  id: string;
  userId: string;
  userName: string;
  category: Category;
  description: string;
  imageUrl: string;
  lat: number;
  long: number;
  status: Status;
  priority: Priority;
  department: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  createdAt: string;
  history: HistoryEntry[];
  proofImageUrl?: string;
}

export interface Feedback {
  complaintId: string;
  rating: number;
  comment: string;
}

const DEPARTMENT_MAP: Record<string, string> = {
  'Garbage': 'Sanitation',
  'Pothole': 'Road Maintenance',
  'Streetlight': 'Electrical',
  'Water Issue': 'Water Supply',
  'Others': 'General Services',
};

export function getDepartment(category: string): string {
  return DEPARTMENT_MAP[category] || 'General Services';
}

export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function generateComplaintId(): string {
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `CMP${num}`;
}

// Sample data
export const SAMPLE_USERS: User[] = [
  { id: 'u1', name: 'Ravi', email: 'ravi@gmail.com', password: 'password123', role: 'Citizen' },
  { id: 'u2', name: 'Admin', email: 'admin@gmail.com', password: 'admin123', role: 'Admin' },
  { id: 'u3', name: 'Citizen 1', email: 'citizen1@gmail.com', password: '123456', role: 'Citizen' },
  { id: 'u4', name: 'Citizen 2', email: 'citizen2@gmail.com', password: '123456', role: 'Citizen' },
  { id: 'fs1', name: 'Arun (Water)', email: 'waterstaff@gmail.com', password: '123456', role: 'Field Staff', department: 'Water Supply' },
  { id: 'fs2', name: 'Priya (Sanitation)', email: 'garbagestaff@gmail.com', password: '123456', role: 'Field Staff', department: 'Sanitation' },
  { id: 'fs3', name: 'Kumar (Roads)', email: 'potholestaff@gmail.com', password: '123456', role: 'Field Staff', department: 'Road Maintenance' },
  { id: 'fs4', name: 'Lakshmi (Electrical)', email: 'streetlightstaff@gmail.com', password: '123456', role: 'Field Staff', department: 'Electrical' },
  { id: 'fs5', name: 'Suresh (General)', email: 'othersstaff@gmail.com', password: '123456', role: 'Field Staff', department: 'General Services' },
  { id: 'fs6', name: 'Divya (Backup)', email: 'backupstaff@gmail.com', password: '123456', role: 'Field Staff', department: 'Backup' },
  { id: 'fs7', name: 'Raj (Supervisor)', email: 'supervisor@gmail.com', password: '123456', role: 'Field Staff', department: 'Supervisor' },
];

export function getAssignedStaff(department: string): { id: string; name: string } | null {
  const staffMap: Record<string, string> = {
    'Water Supply': 'fs1',
    'Sanitation': 'fs2',
    'Road Maintenance': 'fs3',
    'Electrical': 'fs4',
    'General Services': 'fs5',
  };
  const staffId = staffMap[department];
  if (!staffId) return null;
  const staff = SAMPLE_USERS.find(u => u.id === staffId);
  return staff ? { id: staff.id, name: staff.name } : null;
}

export const SAMPLE_COMPLAINTS: Complaint[] = [
  {
    id: 'CMP001',
    userId: 'u1',
    userName: 'Ravi',
    category: 'Garbage',
    description: 'Garbage not cleared for 3 days near Anna Nagar main road. Causing health hazard.',
    imageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=400',
    lat: 13.0827,
    long: 80.2707,
    status: 'Pending',
    priority: 'High',
    department: 'Sanitation',
    assignedStaffId: 'fs2',
    assignedStaffName: 'Priya (Sanitation)',
    createdAt: '2026-03-20T10:30:00Z',
    history: [{ timestamp: '2026-03-20T10:30:00Z', status: 'Pending', note: 'Complaint registered', updatedBy: 'System' }],
  },
  {
    id: 'CMP002',
    userId: 'u1',
    userName: 'Ravi',
    category: 'Pothole',
    description: 'Large pothole causing accidents on T. Nagar road. Multiple vehicles damaged.',
    imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400',
    lat: 13.0674,
    long: 80.2376,
    status: 'In Progress',
    priority: 'Normal',
    department: 'Road Maintenance',
    assignedStaffId: 'fs3',
    assignedStaffName: 'Kumar (Roads)',
    createdAt: '2026-03-19T14:00:00Z',
    history: [
      { timestamp: '2026-03-19T14:00:00Z', status: 'Pending', note: 'Complaint registered', updatedBy: 'System' },
      { timestamp: '2026-03-20T09:00:00Z', status: 'In Progress', note: 'Assigned to field team', updatedBy: 'Admin' },
    ],
  },
  {
    id: 'CMP003',
    userId: 'u1',
    userName: 'Ravi',
    category: 'Streetlight',
    description: 'Streetlight not working near Besant Nagar beach for over a week.',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400',
    lat: 13.0002,
    long: 80.2668,
    status: 'Resolved',
    priority: 'Normal',
    department: 'Electrical',
    assignedStaffId: 'fs4',
    assignedStaffName: 'Lakshmi (Electrical)',
    createdAt: '2026-03-15T08:00:00Z',
    history: [
      { timestamp: '2026-03-15T08:00:00Z', status: 'Pending', note: 'Complaint registered', updatedBy: 'System' },
      { timestamp: '2026-03-16T10:00:00Z', status: 'In Progress', note: 'Electrician dispatched', updatedBy: 'Admin' },
      { timestamp: '2026-03-18T16:00:00Z', status: 'Resolved', note: 'Streetlight replaced', updatedBy: 'Kumar' },
    ],
  },
  {
    id: 'CMP004',
    userId: 'u1',
    userName: 'Ravi',
    category: 'Water Issue',
    description: 'No water supply for 2 days in Mylapore area. Urgent attention needed.',
    imageUrl: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=400',
    lat: 13.0368,
    long: 80.2676,
    status: 'Pending',
    priority: 'High',
    department: 'Water Supply',
    assignedStaffId: 'fs1',
    assignedStaffName: 'Arun (Water)',
    createdAt: '2026-03-21T07:00:00Z',
    history: [{ timestamp: '2026-03-21T07:00:00Z', status: 'Pending', note: 'Complaint registered', updatedBy: 'System' }],
  },
  {
    id: 'CMP005',
    userId: 'u1',
    userName: 'Ravi',
    category: 'Garbage',
    description: 'Open dumping of construction waste blocking pedestrian path in Adyar.',
    imageUrl: 'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=400',
    lat: 13.0063,
    long: 80.2574,
    status: 'Pending',
    priority: 'Normal',
    department: 'Sanitation',
    assignedStaffId: 'fs2',
    assignedStaffName: 'Priya (Sanitation)',
    createdAt: '2026-03-22T06:00:00Z',
    history: [{ timestamp: '2026-03-22T06:00:00Z', status: 'Pending', note: 'Complaint registered', updatedBy: 'System' }],
  },
];
