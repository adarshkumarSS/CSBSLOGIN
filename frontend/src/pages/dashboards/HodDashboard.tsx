import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { FileText, Download } from 'lucide-react';

import { UserManagementContent } from '../UserManagement';

interface Meeting {
  _id: string;
  month: number;
  year: number;
  type: string;
  degree: string;
  semester: number;
  section: string;
  status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'COMPLETED';
  pdf_path?: string;
  tutor_id: { name: string; department: string };
  department: string;
}

const HodDashboard = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  // Allocation State
  const [view, setView] = useState<'MEETINGS' | 'ALLOCATION' | 'USERS'>('MEETINGS');
  const [students, setStudents] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedTutor, setSelectedTutor] = useState<string>('');
  const [filters, setFilters] = useState({ year: 'III', semester: '5', section: 'A' });
  const [allocLoading, setAllocLoading] = useState(false);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  const fetchMeetings = async () => {
    try {
      const res = await api.get('/meetings');
      setMeetings(res.data.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch meetings');
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculties = async () => {
      try {
          const res = await api.get('/allocation/faculties');
          setFaculties(res.data.data);
      } catch (e) { toast.error('Failed to fetch faculties'); }
  };

  const fetchStudents = async () => {
      setAllocLoading(true);
      try {
          const params = new URLSearchParams(filters).toString();
          const res = await api.get(`/allocation/students?${params}`);
          setStudents(res.data.data);
          setSelectedStudents([]); // Reset selection on new fetch
          setLastSelectedIndex(null);
      } catch (e) { toast.error('Failed to fetch students'); }
      finally { setAllocLoading(false); }
  };

  const handleAssign = async () => {
      if (!selectedTutor || selectedStudents.length === 0) return;
      try {
          await api.post('/allocation/assign', { studentIds: selectedStudents, tutorId: selectedTutor });
          toast.success('Assigned successfully');
          fetchStudents(); // Refresh
          setSelectedStudents([]);
      } catch (e: any) {
          toast.error(e.response?.data?.message || 'Assignment failed');
      }
  };

  const toggleSelectAll = () => {
      if (selectedStudents.length === students.length) {
          setSelectedStudents([]);
          setLastSelectedIndex(null);
      } else {
          setSelectedStudents(students.map(s => s._id));
          setLastSelectedIndex(null);
      }
  };

  const handleStudentSelect = (id: string, index: number, e: any) => {
      // Cast e to native event to check shift key, React SyntheticEvent checking is similar
      const isShift = (e.nativeEvent as MouseEvent).shiftKey || (e as any).shiftKey;
      const isChecked = e.target.checked;

      if (isShift && lastSelectedIndex !== null) {
          const start = Math.min(lastSelectedIndex, index);
          const end = Math.max(lastSelectedIndex, index);
          
          const newSelection = [...selectedStudents];
          const rangeIds = students.slice(start, end + 1).map(s => s._id);

          if (isChecked) {
              // Add range to selection
              rangeIds.forEach(rid => {
                  if (!newSelection.includes(rid)) newSelection.push(rid);
              });
          } else {
              // Remove range from selection (optional, but good UX if checking sets false)
               // However, standard shift-click usually extends the "active" state. 
               // If checking a box, we add. If unchecking, we remove?
               // Let's assume user wants to SELECT fast. 
               rangeIds.forEach(rid => {
                   const idx = newSelection.indexOf(rid);
                   if (idx > -1) newSelection.splice(idx, 1);
               });
          }
          setSelectedStudents(newSelection);
      } else {
          // Normal Click
          if (isChecked) {
              setSelectedStudents([...selectedStudents, id]);
          } else {
              setSelectedStudents(selectedStudents.filter(sid => sid !== id));
          }
          setLastSelectedIndex(index);
      }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  useEffect(() => {
    if (view === 'ALLOCATION') {
        fetchFaculties();
    }
  }, [view]);

  const title = "HOD Dashboard";
  const subtitle = `Welcome, ${user?.name}!`;

  return (
    <DashboardLayout title={title} subtitle={subtitle}>
      <div className="space-y-6">
        <div className="flex space-x-4 border-b pb-2">
            <button className={`pb-2 font-medium ${view === 'MEETINGS' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`} onClick={() => setView('MEETINGS')}>Meetings</button>
            <button className={`pb-2 font-medium ${view === 'USERS' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`} onClick={() => setView('USERS')}>User Management</button>
            <button className={`pb-2 font-medium ${view === 'ALLOCATION' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`} onClick={() => setView('ALLOCATION')}>Allocation</button>
        </div>

        {view === 'MEETINGS' ? (
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-semibold">Department Meetings & Reports</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3">Tutor</th>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Class</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? <tr><td colSpan={5} className="px-4 py-4 text-center">Loading...</td></tr> : 
                         meetings.length === 0 ? <tr><td colSpan={5} className="px-4 py-4 text-center">No meetings found</td></tr> :
                         meetings.map(meeting => (
                            <tr key={meeting._id} className="hover:bg-muted/50">
                                <td className="px-4 py-3">
                                    <div className="font-medium">{meeting.tutor_id?.name}</div>
                                    <div className="text-xs text-muted-foreground">{meeting.department}</div>
                                </td>
                                <td className="px-4 py-3">{meeting.month}/{meeting.year}</td>
                                <td className="px-4 py-3">{meeting.degree} {meeting.semester}-{meeting.section}</td>
                                <td className="px-4 py-3">{meeting.type}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        meeting.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                                        meeting.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-gray-100'
                                    }`}>{meeting.status}</span>
                                </td>
                            </tr>
                         ))
                        }
                    </tbody>
                </table>
            </div>
        </div>
        ) : view === 'USERS' ? (
           <UserManagementContent />
        ) : (
            <div className="space-y-4">
                <Card>
                    <CardHeader><CardTitle>Assign Tutors</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-4 gap-4 items-end">
                            <div>
                                <label className="text-sm font-medium">Year</label>
                                <select 
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                    value={filters.year} 
                                    onChange={e => setFilters({...filters, year: e.target.value})}
                                >
                                    <option value="">Select Year</option>
                                    <option value="I">I</option>
                                    <option value="II">II</option>
                                    <option value="III">III</option>
                                    <option value="IV">IV</option>
                                </select>
                            </div>
                            <div><label className="text-sm font-medium">Semester</label><input className="flex h-10 w-full rounded-md border border-input bg-background px-3" value={filters.semester} onChange={e => setFilters({...filters, semester: e.target.value})} /></div>
                            <div><label className="text-sm font-medium">Section</label><input className="flex h-10 w-full rounded-md border border-input bg-background px-3" value={filters.section} onChange={e => setFilters({...filters, section: e.target.value})} /></div>
                            <Button onClick={fetchStudents} disabled={allocLoading}>Fetch Students</Button>
                        </div>
                    </CardContent>
                </Card>

                {students.length > 0 && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Student List ({selectedStudents.length} selected)</CardTitle>
                            <div className="flex items-center gap-2">
                                <select className="flex h-10 rounded-md border border-input bg-background px-3 text-sm" 
                                    value={selectedTutor} onChange={e => setSelectedTutor(e.target.value)}>
                                    <option value="">Select Faculty to Assign...</option>
                                    {faculties.map(f => <option key={f._id} value={f._id}>{f.name} ({f.department})</option>)}
                                </select>
                                <Button onClick={handleAssign} disabled={!selectedTutor || selectedStudents.length === 0}>Assign Tutor</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="max-h-[500px] overflow-auto border rounded">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2 w-10"><input type="checkbox" checked={selectedStudents.length === students.length && students.length > 0} onChange={toggleSelectAll} /></th>
                                            <th className="px-4 py-2">Roll No</th>
                                            <th className="px-4 py-2">Name</th>
                                            <th className="px-4 py-2">Current Tutor</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {students.map((s, index) => (
                                            <tr key={s._id}>
                                                <td className="px-4 py-2"><input type="checkbox" checked={selectedStudents.includes(s._id)} 
                                                    onChange={(e) => handleStudentSelect(s._id, index, e)} 
                                                    // Also add onClick to ensure we catch modifier keys reliably if onChange misses them (React onChange sometimes behaves oddly with modifiers)
                                                    // Actually React onChange event typically includes shiftKey properties.
                                                /></td>
                                                <td className="px-4 py-2">{s.roll_number}</td>
                                                <td className="px-4 py-2">{s.name}</td>
                                                <td className="px-4 py-2 text-muted-foreground">{s.tutor_id?.name || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default HodDashboard;
