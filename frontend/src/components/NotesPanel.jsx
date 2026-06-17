import React, { useState, useEffect, useCallback } from 'react';
import { noteService, uploadService } from '../services/api';
import { useAuthStore } from '../store';

const NotesPanel = ({ profileUserId, isOwn }) => {
  const currentUser = useAuthStore((state) => state.user);

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [expandedNote, setExpandedNote] = useState(null);

  const [form, setForm] = useState({
    title: '',
    summary: '',
    tags: '',
    sections: [{ heading: '', content: '' }],
    isPublic: true
  });
  const [uploadingFile, setUploadingFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchNotes = useCallback(() => {
    if (!profileUserId) return;
    setLoading(true);
    noteService.getUserNotes(profileUserId)
      .then((data) => setNotes(data.notes || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [profileUserId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const resetForm = () => {
    setForm({ title: '', summary: '', tags: '', sections: [{ heading: '', content: '' }], isPublic: true });
    setUploadedFiles([]);
    setEditingNote(null);
    setShowForm(false);
  };

  const openEdit = (note) => {
    setEditingNote(note);
    setForm({
      title: note.title,
      summary: note.summary || '',
      tags: (note.tags || []).join(', '),
      sections: note.sections?.length ? note.sections : [{ heading: '', content: '' }],
      isPublic: note.isPublic
    });
    setUploadedFiles(note.files || []);
    setShowForm(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(file.name);
    try {
      const result = await uploadService.uploadFile(file);
      setUploadedFiles((prev) => [...prev, { name: file.name, url: result.fileUrl, type: result.messageType }]);
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploadingFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);

    const payload = {
      title: form.title.trim(),
      summary: form.summary.trim(),
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      sections: form.sections.filter((s) => s.heading || s.content),
      files: uploadedFiles,
      isPublic: form.isPublic
    };

    try {
      if (editingNote) {
        await noteService.updateNote(editingNote._id, payload);
      } else {
        await noteService.createNote(payload);
      }
      resetForm();
      fetchNotes();
    } catch (err) {
      console.error('Save note error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await noteService.deleteNote(id);
      setNotes((prev) => prev.filter((n) => n._id !== id));
      if (expandedNote?._id === id) setExpandedNote(null);
    } catch (err) {
      console.error('Delete note error:', err);
    }
  };

  const addSection = () => {
    setForm((prev) => ({ ...prev, sections: [...prev.sections, { heading: '', content: '' }] }));
  };

  const removeSection = (idx) => {
    setForm((prev) => ({ ...prev, sections: prev.sections.filter((_, i) => i !== idx) }));
  };

  const updateSection = (idx, field, value) => {
    setForm((prev) => {
      const s = [...prev.sections];
      s[idx] = { ...s[idx], [field]: value };
      return { ...prev, sections: s };
    });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 dark:text-white">
          Notes <span className="text-xs text-gray-400 font-normal">({notes.length})</span>
        </h3>
        {isOwn && (
          <button
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="text-sm text-blue-500 hover:text-blue-600 font-medium"
            type="button"
          >
            {showForm ? 'Cancel' : '+ New Note'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Note title"
            maxLength={200}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500"
            required
          />

          <textarea
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            placeholder="Brief summary..."
            maxLength={500}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm resize-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Sections</span>
              <button type="button" onClick={addSection} className="text-xs text-blue-500 hover:text-blue-600">+ Add Section</button>
            </div>
            {form.sections.map((sec, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <div className="flex-1 space-y-1">
                  <input
                    type="text"
                    value={sec.heading}
                    onChange={(e) => updateSection(idx, 'heading', e.target.value)}
                    placeholder="Section heading"
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-xs focus:ring-1 focus:ring-blue-500"
                  />
                  <textarea
                    value={sec.content}
                    onChange={(e) => updateSection(idx, 'content', e.target.value)}
                    placeholder="Section content..."
                    rows={2}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-xs resize-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                {form.sections.length > 1 && (
                  <button type="button" onClick={() => removeSection(idx)} className="text-gray-400 hover:text-red-500 mt-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          <div>
            <span className="text-xs font-medium text-gray-500">Files</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {uploadedFiles.map((f, idx) => (
                <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs flex items-center gap-1">
                  {f.name}
                  <button type="button" onClick={() => setUploadedFiles((prev) => prev.filter((_, i) => i !== idx))} className="hover:text-red-500">×</button>
                </span>
              ))}
              <label className="px-2 py-1 border border-dashed border-gray-300 dark:border-gray-600 rounded text-xs text-gray-500 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                {uploadingFile || '+ Upload'}
                <input type="file" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="Tags (comma separated)"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
            />
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
                className="rounded"
              />
              Public
            </label>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={submitting || !form.title.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm">
              {submitting ? 'Saving...' : editingNote ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={resetForm}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-white text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center text-gray-400 py-8 text-sm">Loading notes...</div>
      ) : notes.length === 0 ? (
        <div className="text-center text-gray-400 py-8 text-sm">
          {isOwn ? 'No notes yet. Create your first note!' : 'No public notes yet.'}
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note._id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedNote(expandedNote?._id === note._id ? null : note)}
                className="w-full text-left p-4 hover:bg-gray-100 dark:hover:bg-gray-700/70 transition"
                type="button"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-800 dark:text-white text-sm">{note.title}</h4>
                    {note.summary && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{note.summary}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400">{formatDate(note.createdAt)}</span>
                      {!note.isPublic && <span className="text-xs text-amber-500">Private</span>}
                      {note.tags?.length > 0 && note.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs text-gray-600 dark:text-gray-300">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <svg className={`w-4 h-4 text-gray-400 mt-1 transition-transform ${expandedNote?._id === note._id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {expandedNote?._id === note._id && (
                <div className="px-4 pb-4 space-y-3">
                  {note.sections?.length > 0 && note.sections.map((sec, idx) => (
                    (sec.heading || sec.content) && (
                      <div key={idx}>
                        {sec.heading && <h5 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{sec.heading}</h5>}
                        {sec.content && <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{sec.content}</p>}
                      </div>
                    )
                  ))}

                  {note.files?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {note.files.map((f, idx) => (
                        <a key={idx} href={f.url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs hover:underline">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {f.name}
                        </a>
                      ))}
                    </div>
                  )}

                  {isOwn && (
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => openEdit(note)} className="text-xs text-blue-500 hover:text-blue-600" type="button">Edit</button>
                      <button onClick={() => handleDelete(note._id)} className="text-xs text-red-500 hover:text-red-600" type="button">Delete</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesPanel;
