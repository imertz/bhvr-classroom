import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStudentStore } from '../stores';
import { Button } from '../components/ui/button';
import type { StudentInput } from 'shared/dist';

export default function StudentFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  
  const { 
    currentStudent, 
    loading, 
    error, 
    fetchStudent, 
    createStudent, 
    updateStudent, 
    clearError 
  } = useStudentStore();

  const emptyFormData: StudentInput = {
    email: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    grade_level: 1,
    password: ''
  };

  const initialFormData: StudentInput = isEditing && currentStudent
    ? {
        email: currentStudent.email,
        first_name: currentStudent.first_name,
        last_name: currentStudent.last_name,
        date_of_birth: currentStudent.date_of_birth.split('T')[0],
        grade_level: currentStudent.grade_level,
        password: ''
      }
    : emptyFormData;

  const [formDraft, setFormDraft] = useState<{
    id: string | undefined;
    data: StudentInput;
  } | null>(null);

  const formData = formDraft && formDraft.id === id ? formDraft.data : initialFormData;

  const updateFormData = (
    update: StudentInput | ((previous: StudentInput) => StudentInput)
  ) => {
    setFormDraft(previousDraft => {
      const previousData = previousDraft && previousDraft.id === id
        ? previousDraft.data
        : initialFormData;

      return {
        id,
        data: typeof update === 'function' ? update(previousData) : update
      };
    });
  };

  useEffect(() => {
    if (isEditing && id) {
      fetchStudent(id);
    }
  }, [isEditing, id, fetchStudent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        date_of_birth: formData.date_of_birth
      };

      if (isEditing && id) {
        // For updates, only send changed fields
        const updateData: Partial<StudentInput> = {};
        if (formData.email !== currentStudent?.email) updateData.email = formData.email;
        if (formData.first_name !== currentStudent?.first_name) updateData.first_name = formData.first_name;
        if (formData.last_name !== currentStudent?.last_name) updateData.last_name = formData.last_name;
        if (formData.date_of_birth !== currentStudent?.date_of_birth.split('T')[0]) {
          updateData.date_of_birth = formData.date_of_birth;
        }
        if (formData.grade_level !== currentStudent?.grade_level) updateData.grade_level = formData.grade_level;
        if (formData.password) updateData.password = formData.password;
        
        await updateStudent(id, updateData);
      } else {
        await createStudent(submitData);
      }
      
      if (!error) {
        navigate('/students');
      }
    } catch (err) {
      console.error('Error saving student:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    updateFormData(prev => ({
      ...prev, 
      [name]: type === 'number' ? parseInt(value) || 0 : value 
    }));
  };

  if (loading && isEditing) {
    return <div className="max-w-2xl mx-auto p-6">Loading student...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        {isEditing ? 'Edit Student' : 'Add New Student'}
      </h1>

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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
            First Name *
          </label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
            Last Name *
          </label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth *
          </label>
          <input
            type="date"
            id="date_of_birth"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="grade_level" className="block text-sm font-medium text-gray-700 mb-2">
            Grade Level *
          </label>
          <select
            id="grade_level"
            name="grade_level"
            value={formData.grade_level}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(grade => (
              <option key={grade} value={grade}>
                Grade {grade}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password {isEditing ? '(leave blank to keep current)' : '(optional)'}
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password || ''}
            onChange={handleInputChange}
            minLength={8}
            placeholder={isEditing ? 'Enter new password to change' : 'Default or student login password (min 8 chars)'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : (isEditing ? 'Update Student' : 'Create Student')}
          </Button>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => navigate('/students')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
