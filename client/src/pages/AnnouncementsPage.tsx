import { useState } from 'react';
import {
  useAnnouncements,
  useClasses,
  useTeachers,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement
} from '../hooks/queries';
import { Button } from '../components/ui/button';
import {
  Field,
  Marker,
  RecordEmpty,
  RecordError,
  RecordHeader,
  RecordLoading,
  RecordPanel,
} from '../components/ui/record';
import { ordinal } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { usePermissions } from '../hooks/usePermissions';
import { useAuthStore } from '../stores/authStore';
import type { Announcement, AnnouncementInput } from 'shared/dist';

export default function AnnouncementsPage() {
  const { isTeacher, canCreate, canEdit, canDelete } = usePermissions();
  const { user } = useAuthStore();
  const { data: announcements = [], isLoading: loadingAnnouncements, error: announcementsError } = useAnnouncements();
  const { data: classes = [], isLoading: loadingClasses } = useClasses();
  const { data: teachers = [], isLoading: loadingTeachers } = useTeachers();

  const createAnnouncementMutation = useCreateAnnouncement();
  const updateAnnouncementMutation = useUpdateAnnouncement();
  const deleteAnnouncementMutation = useDeleteAnnouncement();

  const loading = loadingAnnouncements || loadingClasses || loadingTeachers;
  const error = announcementsError || createAnnouncementMutation.error || updateAnnouncementMutation.error || deleteAnnouncementMutation.error;

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AnnouncementInput>({
    class_id: '',
    teacher_id: '',
    title: '',
    content: '',
    expires_at: null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSubmit: AnnouncementInput = {
      ...formData,
      teacher_id: isTeacher && user?.id ? user.id : (formData.teacher_id || user?.id || ''),
    };

    try {
      if (editingId) {
        await updateAnnouncementMutation.mutateAsync({ id: editingId, data: dataToSubmit });
        setEditingId(null);
      } else {
        await createAnnouncementMutation.mutateAsync(dataToSubmit);
      }

      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error('Failed to submit announcement:', err);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setFormData({
      class_id: announcement.class_id,
      teacher_id: announcement.teacher_id,
      title: announcement.title,
      content: announcement.content,
      expires_at: announcement.expires_at,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      class_id: '',
      teacher_id: '',
      title: '',
      content: '',
      expires_at: null,
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      await deleteAnnouncementMutation.mutateAsync(id);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    resetForm();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getClassName = (classId: string) => {
    const classInfo = classes.find(c => c.id === classId);
    return classInfo ? `${classInfo.name} (${classInfo.subject})` : 'Unknown Class';
  };

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Unknown Teacher';
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div>
      <RecordHeader
        eyebrow="ANNC · Bulletin"
        title="Announcements"
        count={loading ? undefined : announcements.length}
        countLabel="posted"
        action={
          canCreate && (
            <Button onClick={() => (showForm ? closeForm() : setShowForm(true))} variant={showForm ? 'outline' : 'default'}>
              {showForm ? 'Close' : 'Post announcement'}
            </Button>
          )
        }
      />

      {error && <RecordError error={error} />}

      {showForm && (
        <RecordPanel
          eyebrow={editingId ? 'Amend notice' : 'New notice'}
          title={editingId ? 'Edit announcement' : 'Post an announcement'}
        >
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
              <Field index={1} label="Class" htmlFor="announcement-class">
                <select
                  id="announcement-class"
                  value={formData.class_id}
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                  required
                  className="field field-select"
                >
                  <option value="">Select a class</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.subject})
                    </option>
                  ))}
                </select>
              </Field>

              {!isTeacher && (
                <Field index={2} label="Teacher" htmlFor="announcement-teacher">
                  <select
                    id="announcement-teacher"
                    value={formData.teacher_id}
                    onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                    required
                    className="field field-select"
                  >
                    <option value="">Select a teacher</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.first_name} {teacher.last_name}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              <Field index={3} label="Title" htmlFor="announcement-title" className="md:col-span-2">
                <input
                  id="announcement-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="field"
                  placeholder="Field trip on Friday"
                />
              </Field>

              <Field index={4} label="Content" htmlFor="announcement-content" className="md:col-span-2">
                <textarea
                  id="announcement-content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  rows={4}
                  className="field field-box"
                />
              </Field>

              <Field
                index={5}
                label="Expires (optional)"
                htmlFor="announcement-expires"
                className="md:col-span-2"
              >
                <input
                  id="announcement-expires"
                  type="datetime-local"
                  value={formData.expires_at || ''}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value || null })}
                  className="field"
                />
              </Field>
            </div>

            <div className="mt-8 flex gap-3 border-t border-rule pt-6">
              <Button
                type="submit"
                disabled={createAnnouncementMutation.isPending || updateAnnouncementMutation.isPending}
              >
                {editingId ? 'Update announcement' : 'Post announcement'}
              </Button>
              <Button type="button" onClick={closeForm} variant="outline">
                Cancel
              </Button>
            </div>
          </form>
        </RecordPanel>
      )}

      {loading ? (
        <RecordLoading label="Reading the bulletin" />
      ) : announcements.length === 0 ? (
        <RecordEmpty label="Bulletin empty">
          Nothing has been posted yet. The first announcement will appear here.
        </RecordEmpty>
      ) : (
        <div className="stagger">
          {announcements.map((announcement: Announcement, i) => {
            const expired = isExpired(announcement.expires_at);
            const pending =
              deleteAnnouncementMutation.isPending &&
              deleteAnnouncementMutation.variables === announcement.id;

            return (
              <article
                key={announcement.id}
                className={cn(
                  'group grid gap-x-8 gap-y-5 border-b border-rule px-6 py-9 transition-colors duration-100 hover:bg-muted/40 sm:px-8 lg:grid-cols-[3rem_1fr_7rem] lg:px-12',
                  expired && 'opacity-55',
                  pending && 'pointer-events-none opacity-30'
                )}
              >
                <span className="index-numeral text-[0.6875rem] text-muted-foreground transition-colors duration-100 group-hover:text-signal">
                  {ordinal(i + 1)}
                </span>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="micro micro-signal">{getClassName(announcement.class_id)}</span>
                    <span className="micro">{getTeacherName(announcement.teacher_id)}</span>
                    <span className="index-numeral text-[0.6875rem] text-muted-foreground">
                      {formatDateTime(announcement.created_at)}
                    </span>
                    {expired && <Marker tone="alert">Expired</Marker>}
                  </div>

                  <h2 className="mt-4 text-[1.375rem] font-semibold tracking-[-0.03em]">
                    {announcement.title}
                  </h2>

                  <p className="mt-3 max-w-2xl whitespace-pre-wrap text-[0.9375rem] leading-[1.7] text-foreground/80">
                    {announcement.content}
                  </p>

                  {announcement.expires_at && (
                    <p className="micro mt-6">
                      Expires {formatDateTime(announcement.expires_at)}
                    </p>
                  )}
                </div>

                {(canEdit || canDelete) && (
                  <div className="flex items-start gap-4 lg:justify-end">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleEdit(announcement)}
                        className="micro transition-colors duration-100 hover:text-signal focus-visible:text-signal"
                      >
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(announcement.id)}
                        className="micro transition-colors duration-100 hover:text-destructive focus-visible:text-destructive"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
