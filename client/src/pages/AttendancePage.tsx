import { useEffect, useState } from 'react';
import { useAttendanceStore, useStudentStore, useClassStore } from '../stores';
import { Button } from '../components/ui/button';
import { usePermissions } from '../hooks/usePermissions';
import { formatDate } from '../lib/utils';
import type { Attendance, AttendanceInput } from 'shared/dist';

export default function AttendancePage() {
  const { 
    attendances, 
    loading, 
    error, 
    fetchAttendances, 
    createAttendance,
    updateAttendance,
    deleteAttendance, 
    clearError 
  } = useAttendanceStore();

  const { students, fetchStudents } = useStudentStore();
  const { classes, fetchClasses } = useClassStore();
  const { isAdmin, isTeacher, isStudent } = usePermissions();

  const canManageAttendance = isAdmin || isTeacher;

  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AttendanceInput>({
    student_id: '',
    class_id: '',
    date: getTodayString(),
    status: 'present',
    notes: '',
  });

  useEffect(() => {
    fetchAttendances();
    fetchStudents();
    fetchClasses();
  }, [fetchAttendances, fetchStudents, fetchClasses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit = { ...formData };
    
    if (editingId) {
      await updateAttendance(editingId, dataToSubmit);
      setEditingId(null);
    } else {
      await createAttendance(dataToSubmit);
    }
    
    setShowForm(false);
    resetForm();
  };

  const handleEdit = (attendance: Attendance) => {
    setEditingId(attendance.id);
    setFormData({
      student_id: attendance.student_id,
      class_id: attendance.class_id,
      date: attendance.date.split('T')[0] || getTodayString(),
      status: attendance.status,
      notes: attendance.notes || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      class_id: '',
      date: getTodayString(),
      status: 'present',
      notes: '',
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this attendance record?')) {
      await deleteAttendance(id);
    }
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? `${student.first_name} ${student.last_name}` : 'Unknown Student';
  };

  const getClassName = (classId: string) => {
    const class_ = classes.find(c => c.id === classId);
    return class_ ? class_.name : 'Unknown Class';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'tardy': return 'bg-yellow-100 text-yellow-800';
      case 'excused': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalDays = attendances.length;
  const presentCount = attendances.filter(a => a.status === 'present').length;
  const absentCount = attendances.filter(a => a.status === 'absent').length;
  const tardyCount = attendances.filter(a => a.status === 'tardy' || a.status === 'excused').length;
  const attendanceRate = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 100;

  if (loading) {
    return <div className="max-w-6xl mx-auto p-6">Loading attendance...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{isStudent ? 'My Attendance' : 'Attendance'}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isStudent ? 'Your recorded classroom attendance history' : 'Track and manage student daily presence'}
          </p>
        </div>
        {canManageAttendance && (
          <Button onClick={() => setShowForm(true)}>
            Record Attendance
          </Button>
        )}
      </div>

      {/* Summary KPI Cards */}
      {attendances.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <span className="text-xs font-semibold text-gray-500 uppercase">Attendance Rate</span>
            <div className={`text-2xl font-bold mt-1 ${
              attendanceRate >= 90 ? 'text-green-600' :
              attendanceRate >= 75 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {attendanceRate}%
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <span className="text-xs font-semibold text-gray-500 uppercase">Present</span>
            <div className="text-2xl font-bold text-green-600 mt-1">{presentCount}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <span className="text-xs font-semibold text-gray-500 uppercase">Absent</span>
            <div className="text-2xl font-bold text-red-600 mt-1">{absentCount}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <span className="text-xs font-semibold text-gray-500 uppercase">Tardy / Excused</span>
            <div className="text-2xl font-bold text-yellow-600 mt-1">{tardyCount}</div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
          <button 
            onClick={clearError}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Attendance' : 'Record Attendance'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student
                </label>
                <select
                  value={formData.student_id}
                  onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a student</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.first_name} {student.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class
                </label>
                <select
                  value={formData.class_id}
                  onChange={(e) => setFormData({...formData, class_id: e.target.value})}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a class</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.subject})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as AttendanceInput['status']})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="tardy">Tardy</option>
                  <option value="excused">Excused</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="submit">
                {editingId ? 'Update' : 'Record'} Attendance
              </Button>
              <Button 
                type="button" 
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  resetForm();
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Class
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notes
              </th>
              {canManageAttendance && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {attendances.map((attendance: Attendance) => (
              <tr key={attendance.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {getStudentName(attendance.student_id)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {getClassName(attendance.class_id)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {formatDate(attendance.date)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(attendance.status)}`}>
                    {attendance.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500 max-w-xs truncate">
                    {attendance.notes || '-'}
                  </div>
                </td>
                {canManageAttendance && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(attendance)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(attendance.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {attendances.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {isStudent ? 'No attendance records recorded yet.' : 'No attendance records found. Record your first attendance!'}
          </div>
        )}
      </div>
    </div>
  );
}
