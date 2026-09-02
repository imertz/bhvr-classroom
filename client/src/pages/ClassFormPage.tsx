import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useClass, useCreateClass, useUpdateClass, useTeachers } from '../hooks/queries';
import { Button } from '../components/ui/button';
import {
  Field,
  FormSheet,
  RecordError,
  RecordHeader,
  RecordLoading,
} from '../components/ui/record';
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
    const isNullableField = name === 'room_number' || name === 'schedule';
    updateFormData(prev => ({
      ...prev,
      [name]: value === '' && isNullableField ? null : value
    }));
  };

  return (
    <div>
      <RecordHeader
        eyebrow={isEditing ? 'CLSS · Amend record' : 'CLSS · New record'}
        title={isEditing ? 'Edit Class' : 'Add Class'}
        countLabel="fields"
        count={5}
      />

      {error && <RecordError error={error} />}

      {loading && isEditing ? (
        <RecordLoading label="Reading class record" />
      ) : (
        <FormSheet>
          <form onSubmit={handleSubmit}>
            <Field index={1} label="Class name" htmlFor="name">
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Mathematics 101"
                className="field"
              />
            </Field>

            <Field index={2} label="Subject" htmlFor="subject">
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
                placeholder="Mathematics"
                className="field"
              />
            </Field>

            <Field index={3} label="Teacher" htmlFor="teacher_id">
              <select
                id="teacher_id"
                name="teacher_id"
                value={formData.teacher_id}
                onChange={handleInputChange}
                required
                className="field field-select"
              >
                <option value="">Select a teacher</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.first_name} {teacher.last_name} ({teacher.email})
                  </option>
                ))}
              </select>
            </Field>

            <Field index={4} label="Room number" htmlFor="room_number" optional>
              <input
                type="text"
                id="room_number"
                name="room_number"
                value={formData.room_number || ''}
                onChange={handleInputChange}
                placeholder="A101"
                className="field"
              />
            </Field>

            <Field
              index={5}
              label="Schedule"
              htmlFor="schedule"
              optional
              hint="e.g. Monday, Wednesday, Friday · 09:00–10:30"
            >
              <textarea
                id="schedule"
                name="schedule"
                value={formData.schedule || ''}
                onChange={handleInputChange}
                rows={3}
                className="field field-box"
              />
            </Field>

            <div className="mt-10 flex gap-3 border-t border-rule pt-6">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving…' : isEditing ? 'Update class' : 'Create class'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/classes')}>
                Cancel
              </Button>
            </div>
          </form>
        </FormSheet>
      )}
    </div>
  );
}
