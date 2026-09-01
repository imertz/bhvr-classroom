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
import type { Announcement, AnnouncementInput } from 'shared/dist';

export default function AnnouncementsPage() {
  const { data: announcements = [], isLoading: loadingAnnouncements, error: announcementsError } = useAnnouncements();
  const { data: classes = [], isLoading: loadingClasses } = useClasses();
  const { data: teachers = [], isLoading: loadingTeachers } = useTeachers();

  const createAnnouncementMutation = useCreateAnnouncement();
  const updateAnnouncementMutation = useUpdateAnnouncement();
  const deleteAnnouncementMutation = useDeleteAnnouncement();

  const loading = loadingAnnouncements || loadingClasses || loadingTeachers;
  const error = (announcementsError || createAnnouncementMutation.error || updateAnnouncementMutation.error || deleteAnnouncementMutation.error) as Error | null;

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

    if (editingId) {
      await updateAnnouncementMutation.mutateAsync({ id: editingId, data: formData });
      setEditingId(null);
    } else {
      await createAnnouncementMutation.mutateAsync(formData);
    }

    setShowForm(false);
    resetForm();
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

  if (loading) {
    return <div className="max-w-6xl mx-auto p-6">Loading announcements...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Announcements</h1>
        <Button onClick={() => setShowForm(true)}>
          Create Announcement
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error.message}
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Announcement' : 'Create Announcement'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  Teacher
                </label>
                <select
                  value={formData.teacher_id}
                  onChange={(e) => setFormData({...formData, teacher_id: e.target.value})}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a teacher</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.first_name} {teacher.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  required
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiration Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.expires_at || ''}
                  onChange={(e) => setFormData({...formData, expires_at: e.target.value || null})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="submit">
                {editingId ? 'Update' : 'Create'} Announcement
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

      <div className="grid gap-4">
        {announcements.map((announcement: Announcement) => (
          <div key={announcement.id} className={`bg-white p-6 rounded-lg shadow-md border ${
            isExpired(announcement.expires_at) ? 'opacity-60' : ''
          }`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {announcement.title}
                  {isExpired(announcement.expires_at) && (
                    <span className="ml-2 text-sm text-red-500">(Expired)</span>
                  )}
                </h3>
                <div className="text-sm text-gray-500 mt-1">
                  <span>{getClassName(announcement.class_id)}</span>
                  <span className="mx-2">•</span>
                  <span>by {getTeacherName(announcement.teacher_id)}</span>
                  <span className="mx-2">•</span>
                  <span>{formatDateTime(announcement.created_at)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(announcement)}
                  className="text-indigo-600 hover:text-indigo-900 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(announcement.id)}
                  className="text-red-600 hover:text-red-900 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="text-gray-700 whitespace-pre-wrap">
              {announcement.content}
            </div>
            {announcement.expires_at && (
              <div className="mt-4 text-sm text-gray-500">
                Expires: {formatDateTime(announcement.expires_at)}
              </div>
            )}
          </div>
        ))}
        {announcements.length === 0 && (
          <div className="bg-white p-8 rounded-lg shadow-md border text-center text-gray-500">
            No announcements found. Create your first announcement!
          </div>
        )}
      </div>
    </div>
  );
}
