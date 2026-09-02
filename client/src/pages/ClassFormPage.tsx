import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useClass, useCreateClass, useUpdateClass, useTeachers } from '../hooks/queries';
import { Button } from '../components/ui/button';
import type { ClassInput } from 'shared/dist';

export default function ClassFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const { data: currentClass, isLoading: loadingClass } = useClass(id);
  const { data: teachers = [] } = useTeachers();
  const createClassMutation = useCreateClass();
  const updateClassMutation = useUpdateClass();

  const loading = loadingClass || createClassMutation.isPending || updateClassMutation.isPending;
  const error = createClassMutation.error || updateClassMutation.error;

  const emptyFormData: ClassInput = {
    name: '',
    subject: '',
    teacher_id: '',
    room_number: null,
    schedule: null
  };

  const initialFormData: ClassInput = isEditing && currentClass
    ? {
        name: currentClass.name,
        subject: currentClass.subject,
        teacher_id: currentClass.teacher_id,
        room_number: currentClass.room_number || null,
        schedule: currentClass.schedule || null
      }
    : emptyFormData;

  const [formDraft, setFormDraft] = useState<{
    id: string | undefined;
    data: ClassInput;
  } | null>(null);

  const formData = formDraft && formDraft.id === id ? formDraft.data : initialFormData;

  const updateFormData = (
    update: ClassInput | ((previous: ClassInput) => ClassInput)
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
      const submitData: ClassInput = {
        ...formData,
        room_number: formData.room_number || null,
        schedule: formData.schedule || null
      };

      if (isEditing && id) {
        const updateData: { -readonly [K in keyof ClassInput]?: ClassInput[K] } = {};
        if (formData.name !== currentClass?.name) updateData.name = formData.name;
        if (formData.subject !== currentClass?.subject) updateData.subject = formData.subject;
        if (formData.teacher_id !== currentClass?.teacher_id) updateData.teacher_id = formData.teacher_id;
        if (formData.room_number !== (currentClass?.room_number || null)) {
          updateData.room_number = formData.room_number || null;
        }
        if (formData.schedule !== (currentClass?.schedule || null)) {
          updateData.schedule = formData.schedule || null;
        }

        await updateClassMutation.mutateAsync({ id, data: updateData });
      } else {
        await createClassMutation.mutateAsync(submitData);
      }

      navigate('/classes');
    } catch (err) {
      console.error('Error saving class:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateFormData(prev => ({
      ...prev, 
      [name]: value === '' ? null : value 
    }));
  };

  if (loading && isEditing) {
    return <div className="max-w-2xl mx-auto p-6">Loading class...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        {isEditing ? 'Edit Class' : 'Add New Class'}
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Class Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="e.g., Mathematics 101, Advanced Physics"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
            Subject *
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            required
            placeholder="e.g., Mathematics, Physics, Chemistry"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="teacher_id" className="block text-sm font-medium text-gray-700 mb-2">
            Teacher *
          </label>
          <select
            id="teacher_id"
            name="teacher_id"
            value={formData.teacher_id}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select a teacher</option>
            {teachers.map(teacher => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.first_name} {teacher.last_name} ({teacher.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="room_number" className="block text-sm font-medium text-gray-700 mb-2">
            Room Number
          </label>
          <input
            type="text"
            id="room_number"
            name="room_number"
            value={formData.room_number || ''}
            onChange={handleInputChange}
            placeholder="e.g., A101, Room 205, Science Lab 1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="schedule" className="block text-sm font-medium text-gray-700 mb-2">
            Schedule
          </label>
          <textarea
            id="schedule"
            name="schedule"
            value={formData.schedule || ''}
            onChange={handleInputChange}
            rows={3}
            placeholder="e.g., Monday, Wednesday, Friday 9:00-10:30 AM"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            Enter the class schedule (optional)
          </p>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : (isEditing ? 'Update Class' : 'Create Class')}
          </Button>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => navigate('/classes')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
