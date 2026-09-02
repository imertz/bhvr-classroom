import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTeacher, useCreateTeacher, useUpdateTeacher } from '../hooks/queries';
import { Button } from '../components/ui/button';
import type { TeacherInput } from 'shared/dist';

export default function TeacherFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const { data: currentTeacher, isLoading: loadingTeacher } = useTeacher(id);
  const createTeacherMutation = useCreateTeacher();
  const updateTeacherMutation = useUpdateTeacher();

  const loading = loadingTeacher || createTeacherMutation.isPending || updateTeacherMutation.isPending;
  const error = createTeacherMutation.error || updateTeacherMutation.error;

  const emptyFormData: TeacherInput = {
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'teacher'
  };

  const initialFormData: TeacherInput = isEditing && currentTeacher
    ? {
        email: currentTeacher.email,
        first_name: currentTeacher.first_name,
        last_name: currentTeacher.last_name,
        password: '',
        role: currentTeacher.role
      }
    : emptyFormData;

  const [formDraft, setFormDraft] = useState<{
    id: string | undefined;
    data: TeacherInput;
  } | null>(null);

  const formData = formDraft && formDraft.id === id ? formDraft.data : initialFormData;

  const updateFormData = (
    update: TeacherInput | ((previous: TeacherInput) => TeacherInput)
  ) => {
    setFormDraft(previousDraft => {
      const previousData = previousDraft && previousDraft.id === id
        ? previousDraft.data
        : initialFormData;

      return {
        id,
        data: update instanceof Function ? update(previousData) : update
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing && id) {
        // For updates, only send changed fields and don't require password
        const updateData: { -readonly [K in keyof TeacherInput]?: TeacherInput[K] } = {};
        if (formData.email !== currentTeacher?.email) updateData.email = formData.email;
        if (formData.first_name !== currentTeacher?.first_name) updateData.first_name = formData.first_name;
        if (formData.last_name !== currentTeacher?.last_name) updateData.last_name = formData.last_name;
        if (formData.password) updateData.password = formData.password;

        await updateTeacherMutation.mutateAsync({ id, data: updateData });
      } else {
        await createTeacherMutation.mutateAsync(formData);
      }

      navigate('/teachers');
    } catch (err) {
      console.error('Error saving teacher:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading && isEditing) {
    return <div className="max-w-2xl mx-auto p-6">Loading teacher...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        {isEditing ? 'Edit Teacher' : 'Add New Teacher'}
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error.message}
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
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password {isEditing ? '(leave blank to keep current)' : '*'}
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required={!isEditing}
            minLength={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : (isEditing ? 'Update Teacher' : 'Create Teacher')}
          </Button>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => navigate('/teachers')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
