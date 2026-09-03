import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTeacher, useCreateTeacher, useUpdateTeacher } from '../hooks/queries';
import { Button } from '../components/ui/button';
import {
  Field,
  FormSheet,
  RecordError,
  RecordHeader,
  RecordLoading,
} from '../components/ui/record';
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
        if (!formData.password) {
          throw new Error('Password is required');
        }
        await createTeacherMutation.mutateAsync({
          ...formData,
          password: formData.password,
        });
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

  return (
    <div>
      <RecordHeader
        eyebrow={isEditing ? 'TCHR · Amend record' : 'TCHR · New record'}
        title={isEditing ? 'Edit Teacher' : 'Add Teacher'}
        countLabel="fields"
        count={4}
      />

      {error && <RecordError error={error} />}

      {loading && isEditing ? (
        <RecordLoading label="Reading staff record" />
      ) : (
        <FormSheet>
          <form onSubmit={handleSubmit}>
            <Field index={1} label="Email" htmlFor="email">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="field"
                placeholder="name@school.edu"
              />
            </Field>

            <Field index={2} label="First name" htmlFor="first_name">
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                required
                className="field"
              />
            </Field>

            <Field index={3} label="Last name" htmlFor="last_name">
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                required
                className="field"
              />
            </Field>

            <Field
              index={4}
              label="Password"
              htmlFor="password"
              optional={isEditing}
              hint={isEditing ? 'Leave blank to keep the current password.' : 'Minimum 8 characters.'}
            >
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required={!isEditing}
                minLength={8}
                className="field"
              />
            </Field>

            <div className="mt-10 flex gap-3 border-t border-rule pt-6">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving…' : isEditing ? 'Update teacher' : 'Create teacher'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/teachers')}>
                Cancel
              </Button>
            </div>
          </form>
        </FormSheet>
      )}
    </div>
  );
}
