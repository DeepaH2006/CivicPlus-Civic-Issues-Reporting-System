/*import React, { createContext, useContext, useState, useCallback } from 'react';
import { Complaint, Status, SAMPLE_COMPLAINTS, getDistance, generateComplaintId, getDepartment, getAssignedStaff, Category, Priority, SAMPLE_USERS } from '@/data/store';
import { toast } from 'sonner';

interface ComplaintContextType {
  complaints: Complaint[];
  addComplaint: (data: {
    userId: string;
    userName: string;
    category: Category;
    description: string;
    imageUrl: string;
    lat: number;
    long: number;
    priority: Priority;
  }) => { success: boolean; duplicate?: boolean; id?: string };
  updateStatus: (id: string, status: Status, note: string, updatedBy: string) => void;
  updateProofImage: (id: string, url: string) => void;
  reassignComplaint: (id: string, staffId: string) => void;
  getComplaintsByUser: (userId: string) => Complaint[];
  getComplaintsByDepartment: (department: string) => Complaint[];
  getComplaintsByStatus: (status: Status) => Complaint[];
  getComplaintsByStaff: (staffId: string) => Complaint[];
}

const ComplaintContext = createContext<ComplaintContextType | null>(null);

export function ComplaintProvider({ children }: { children: React.ReactNode }) {
  const [complaints, setComplaints] = useState<Complaint[]>(SAMPLE_COMPLAINTS);

  const addComplaint = useCallback((data: {
    userId: string;
    userName: string;
    category: Category;
    description: string;
    imageUrl: string;
    lat: number;
    long: number;
    priority: Priority;
  }) => {
    // Duplicate detection
    const duplicate = complaints.find(c =>
      c.category === data.category &&
      getDistance(c.lat, c.long, data.lat, data.long) < 50
    );
    if (duplicate) {
      return { success: false, duplicate: true };
    }

    const id = generateComplaintId();
    const department = getDepartment(data.category);
    const staff = getAssignedStaff(department);
    const newComplaint: Complaint = {
      id,
      ...data,
      status: 'Pending',
      department,
      assignedStaffId: staff?.id,
      assignedStaffName: staff?.name,
      createdAt: new Date().toISOString(),
      history: [{ timestamp: new Date().toISOString(), status: 'Pending', note: `Complaint registered. Assigned to ${staff?.name || 'Unassigned'} (${department})`, updatedBy: 'System' }],
    };
    setComplaints(prev => [newComplaint, ...prev]);
    toast.success(`Complaint ${id} registered! Assigned to ${staff?.name || department}`);
    return { success: true, id };
  }, [complaints]);

  const updateStatus = useCallback((id: string, status: Status, note: string, updatedBy: string) => {
    setComplaints(prev => prev.map(c =>
      c.id === id ? {
        ...c,
        status,
        history: [...c.history, { timestamp: new Date().toISOString(), status, note, updatedBy }],
      } : c
    ));
    toast.success(`Complaint ${id} updated to ${status}`);
  }, []);

  const updateProofImage = useCallback((id: string, url: string) => {
    setComplaints(prev => prev.map(c =>
      c.id === id ? { ...c, proofImageUrl: url } : c
    ));
  }, []);

  const reassignComplaint = useCallback((id: string, staffId: string) => {
    const staff = SAMPLE_USERS.find(u => u.id === staffId);
    if (!staff) return;
    setComplaints(prev => prev.map(c =>
      c.id === id ? {
        ...c,
        assignedStaffId: staff.id,
        assignedStaffName: staff.name,
        history: [...c.history, { timestamp: new Date().toISOString(), status: c.status, note: `Reassigned to ${staff.name}`, updatedBy: 'Admin' }],
      } : c
    ));
    toast.success(`Complaint ${id} reassigned to ${staff.name}`);
  }, []);

  const getComplaintsByUser = useCallback((userId: string) =>
    complaints.filter(c => c.userId === userId), [complaints]);

  const getComplaintsByDepartment = useCallback((department: string) =>
    complaints.filter(c => c.department === department), [complaints]);

  const getComplaintsByStatus = useCallback((status: Status) =>
    complaints.filter(c => c.status === status), [complaints]);

  const getComplaintsByStaff = useCallback((staffId: string) =>
    complaints.filter(c => c.assignedStaffId === staffId), [complaints]);

  return (
    <ComplaintContext.Provider value={{
      complaints, addComplaint, updateStatus, updateProofImage, reassignComplaint,
      getComplaintsByUser, getComplaintsByDepartment, getComplaintsByStatus, getComplaintsByStaff,
    }}>
      {children}
    </ComplaintContext.Provider>
  );
}

export function useComplaints() {
  const ctx = useContext(ComplaintContext);
  if (!ctx) throw new Error('useComplaints must be used within ComplaintProvider');
  return ctx;
}*/

import { createContext, useContext, useEffect, useState } from "react";

const ComplaintContext = createContext<any>(null);

export const ComplaintProvider = ({ children }: { children: React.ReactNode }) => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComplaints = async () => {
    try {
      const response = await fetch("http://localhost:5000/complaints");
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
        loading,
      }}
    >
      {children}
    </ComplaintContext.Provider>
  );
};

export const useComplaints = () => useContext(ComplaintContext);