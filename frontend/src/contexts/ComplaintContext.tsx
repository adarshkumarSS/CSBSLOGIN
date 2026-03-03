import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

// Types
export type ComplaintType = 'Academic' | 'Complaint' | 'Doubt' | 'Other';
export type ComplaintStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected by Coordinator'
  | 'Resolved'
  | 'Unresolved'
  | 'Rejected by Staff';

export interface Complaint {
  id: string;
  studentId: string;
  studentName: string;
  registerNumber?: string;
  year: string;
  subject: string;
  staffName: string;
  type: ComplaintType;
  description: string;
  status: ComplaintStatus;
  coordinatorRemarks?: string;
  staffRemarks?: string;
  timestamp: Date;
}

interface SubjectStaff {
  subject: string;
  staff: string;
}

interface ComplaintContextType {
  complaints: Complaint[];
  subjectsAndStaff: Record<string, SubjectStaff[]>;
  addComplaint: (complaint: Omit<Complaint, 'id' | 'status' | 'timestamp' | 'studentId' | 'studentName' | 'registerNumber'>) => Promise<void>;
  updateComplaintStatus: (id: string, status: ComplaintStatus, remarks?: string, remarkType?: 'coordinator' | 'staff') => Promise<void>;
  fetchComplaints: () => Promise<void>;
  fetchSubjects: () => Promise<void>;
  isLoading: boolean;
}

const ComplaintContext = createContext<ComplaintContextType | undefined>(undefined);

// API Setup
const api = axios.create({
    baseURL: 'http://localhost:5000/api', // ensure this matches your backend
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const ComplaintProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [subjectsAndStaff, setSubjectsAndStaff] = useState<Record<string, SubjectStaff[]>>({
    I: [],
    II: [],
    III: [],
    IV: []
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch complaints from backend
  const fetchComplaints = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/complaints');

      // Transform backend data to frontend format
      const transformedComplaints: Complaint[] = data.map((complaint: any) => ({
        id: complaint._id,
        studentId: complaint.student?._id || '',
        studentName: complaint.student?.name || 'Unknown',
        registerNumber: complaint.student?.registerNumber,
        year: complaint.year,
        subject: complaint.subject?.name || complaint.subject,
        staffName: complaint.staffName || 'Unknown',
        type: complaint.type,
        description: complaint.description,
        status: complaint.status,
        coordinatorRemarks: complaint.coordinatorRemarks,
        staffRemarks: complaint.staffRemarks,
        timestamp: new Date(complaint.createdAt)
      }));

      setComplaints(transformedComplaints);
    } catch (error: any) {
      console.error('Error fetching complaints:', error);
      // Don't toast on mount if empty, but good for debugging
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch subjects and staff from backend
  const fetchSubjects = async () => {
    try {
      const { data } = await api.get('/options'); // Adapted route

      // Transform backend data to frontend format
      const transformed: Record<string, SubjectStaff[]> = {
        I: [],
        II: [],
        III: [],
        IV: []
      };

      data.forEach((item: any) => {
        const year = item.year;
        if (transformed[year]) {
            transformed[year].push({
                subject: item.subjectName,
                staff: item.assignedStaffName
            });
        }
      });

      setSubjectsAndStaff(transformed);
    } catch (error: any) {
      console.error('Error fetching subjects:', error);
    }
  };

  // Add new complaint
  const addComplaint = async (complaint: Omit<Complaint, 'id' | 'status' | 'timestamp' | 'studentId' | 'studentName' | 'registerNumber'>) => {
    try {
      setIsLoading(true);
      await api.post('/complaints', {
        year: complaint.year,
        subject: complaint.subject,
        staffName: complaint.staffName,
        type: complaint.type,
        description: complaint.description
      });

      toast.success('Complaint submitted successfully');
      await fetchComplaints();
    } catch (error: any) {
      console.error('Error adding complaint:', error);
      toast.error(error.response?.data?.message || 'Failed to submit complaint');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update complaint status
  const updateComplaintStatus = async (
    id: string,
    status: ComplaintStatus,
    remarks?: string,
    remarkType?: 'coordinator' | 'staff'
  ) => {
    try {
      setIsLoading(true);
      const updateData: any = { status };
      if (remarks) updateData.remarks = remarks;
      if (remarkType) updateData.remarkType = remarkType;

      await api.patch(`/complaints/${id}`, updateData);

      toast.success('Complaint updated successfully');
      await fetchComplaints();
    } catch (error: any) {
      console.error('Error updating complaint:', error);
      toast.error(error.response?.data?.message || 'Failed to update complaint');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount or user change
  useEffect(() => {
    if (user) {
      fetchComplaints();
      fetchSubjects();
    }
  }, [user]);

  return (
    <ComplaintContext.Provider value={{
      complaints,
      subjectsAndStaff,
      addComplaint,
      updateComplaintStatus,
      fetchComplaints,
      fetchSubjects,
      isLoading
    }}>
      {children}
    </ComplaintContext.Provider>
  );
};

export const useComplaints = () => {
  const context = useContext(ComplaintContext);
  if (!context) {
    throw new Error('useComplaints must be used within ComplaintProvider');
  }
  return context;
};
