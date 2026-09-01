import { useEffect, useState } from 'react';
import { useEnrollmentStore, useStudentStore, useClassStore } from '../stores';
import { Button } from '../components/ui/button';
import type { Enrollment, EnrollmentInput } from 'shared/dist';

export default function EnrollmentsPage() {
  const { 
    enrollments, 
    loading, 
    error, 
    fetchEnrollments, 
    createEnrollment,
    updateEnrollment,
    deleteEnrollment, 
    clearError 
  } = useEnrollmentStore();

  const { students, fetchStudents } = useStudentStore();
  const { classes, fetchClasses } = useClassStore();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EnrollmentInput>({
    student_id: '',
    class_id: '',
    status: 'active',
  });

  useEffect(() => {
    fetchEnrollments();
    fetchStudents();
    fetchClasses();
  }, [fetchEnrollments, fetchStudents, fetchClasses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      await updateEnrollment(editingId, formData);
      setEditingId(null);
    } else {
      await createEnrollment(formData);
    }
    
    setShowForm(false);
    resetForm();
  };

  const handleEdit = (enrollment: Enrollment) => {
    setEditingId(enrollment.id);
    setFormData({
      student_id: enrollment.student_id,
      class_id: enrollment.class_id,
      status: enrollment.status,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      class_id: '',
      status: 'active',
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this enrollment?')) {
      await deleteEnrollment(id);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? `${student.first_name} ${student.last_name}` : 'Unknown Student';
  };

  const getStudentEmail = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student?.email || 'No email';
  };

  const getClassName = (classId: string) => {
    const classInfo = classes.find(c => c.id === classId);
    return classInfo ? `${classInfo.name} (${classInfo.subject})` : 'Unknown Class';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'dropped': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Group enrollments by class for better organization
  const enrollmentsByClass = enrollments.reduce((acc, enrollment) => {
    const className = getClassName(enrollment.class_id);
    if (!acc[className]) {
      acc[className] = [];
    }
    acc[className].push(enrollment);
    return acc;
  }, {} as Record<string, Enrollment[]>);

  if (loading) {
    return <div className="max-w-6xl mx-auto p-6">Loading enrollments...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Enrollments</h1>
        <Button onClick={() => setShowForm(true)}>
          Add Enrollment
        </Button>
      </div>

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
            {editingId ? 'Edit Enrollment' : 'Add Enrollment'}
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
                      {student.first_name} {student.last_name} ({student.email})
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
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as NonNullable<EnrollmentInput['status']>})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="dropped">Dropped</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="submit">
                {editingId ? 'Update' : 'Add'} Enrollment
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

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900">Total Enrollments</h3>
          <p className="text-3xl font-bold text-blue-600">{enrollments.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900">Active Students</h3>
          <p className="text-3xl font-bold text-green-600">
            {enrollments.filter(e => e.status === 'active').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900">Classes with Students</h3>
          <p className="text-3xl font-bold text-purple-600">
            {Object.keys(enrollmentsByClass).length}
          </p>
        </div>
      </div>

      {/* Enrollments by Class */}
      <div className="space-y-6">
        {Object.entries(enrollmentsByClass).map(([className, classEnrollments]) => (
          <div key={className} className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{className}</h3>
              <p className="text-sm text-gray-500">{classEnrollments.length} students enrolled</p>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrolled At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classEnrollments.map((enrollment: Enrollment) => (
                  <tr key={enrollment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getStudentName(enrollment.student_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {getStudentEmail(enrollment.student_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(enrollment.status)}`}>
                        {enrollment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatDateTime(enrollment.enrolled_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(enrollment)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(enrollment.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {enrollments.length === 0 && (
          <div className="bg-white p-8 rounded-lg shadow-md border text-center text-gray-500">
            No enrollments found. Add your first enrollment!
          </div>
        )}
      </div>
    </div>
  );
}
