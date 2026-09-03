import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStudent, useCreateStudent, useUpdateStudent } from '../hooks/queries';
import { Button } from '../components/ui/button';
import {
  Field,
  FormSheet,
  RecordError,
  RecordHeader,
  RecordLoading,
} from '../components/ui/record';
import type { StudentInput } from 'shared/dist';

export default function StudentFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const { data: currentStudent, isLoading: loadingStudent } = useStudent(id);
  const createStudentMutation = useCreateStudent();
  const updateStudentMutation = useUpdateStudent();

  const loading = loadingStudent || createStudentMutation.isPending || updateStudentMutation.isPending;
  const error = createStudentMutation.error || updateStudentMutation.error;

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
        date_of_birth: currentStudent.date_of_birth ? currentStudent.date_of_birth.slice(0, 10) : '',
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
        data: update instanceof Function ? update(previousData) : update
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const submitData = {
        ...formData,
        date_of_birth: formData.date_of_birth
      };

      if (isEditing && id) {
        // For updates, only send changed fields
        const updateData: { -readonly [K in keyof StudentInput]?: StudentInput[K] } = {};
        if (formData.email !== currentStudent?.email) updateData.email = formData.email;
        if (formData.first_name !== currentStudent?.first_name) updateData.first_name = formData.first_name;
        if (formData.last_name !== currentStudent?.last_name) updateData.last_name = formData.last_name;
        const currentDob = currentStudent?.date_of_birth ? currentStudent.date_of_birth.slice(0, 10) : '';
        if (formData.date_of_birth !== currentDob) {
          updateData.date_of_birth = formData.date_of_birth;
        }
        if (formData.grade_level !== currentStudent?.grade_level) updateData.grade_level = formData.grade_level;
        if (formData.password) updateData.password = formData.password;

        await updateStudentMutation.mutateAsync({ id, data: updateData });
      } else {
        if (!formData.password) {
          throw new Error('Password is required');
        }
        await createStudentMutation.mutateAsync({
          ...submitData,
          password: formData.password,
        });
      }

      navigate('/students');
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

  return (
    <div>
      <RecordHeader
        eyebrow={isEditing ? 'STDN · Amend record' : 'STDN · New record'}
        title={isEditing ? 'Edit Student' : 'Add Student'}
        countLabel="fields"
        count={6}
      />

      {error && <RecordError error={error} />}

      {loading && isEditing ? (
        <RecordLoading label="Reading student record" />
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

            <Field index={4} label="Date of birth" htmlFor="date_of_birth">
              <input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                required
                className="field"
              />
            </Field>

            <Field index={5} label="Grade level" htmlFor="grade_level">
              <select
                id="grade_level"
                name="grade_level"
                value={formData.grade_level}
                onChange={handleInputChange}
                required
                className="field field-select"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(grade => (
                  <option key={grade} value={grade}>
                    Grade {grade}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              index={6}
              label="Password"
              htmlFor="password"
              optional={isEditing}
              hint={
                isEditing
                  ? 'Leave blank to keep the current password.'
                  : 'Student login password — minimum 8 characters.'
              }
            >
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password || ''}
                onChange={handleInputChange}
                required={!isEditing}
                minLength={8}
                className="field"
              />
            </Field>

            <div className="mt-10 flex gap-3 border-t border-rule pt-6">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving…' : isEditing ? 'Update student' : 'Create student'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/students')}>
                Cancel
              </Button>
            </div>
          </form>
        </FormSheet>
      )}
    </div>
  );
}
