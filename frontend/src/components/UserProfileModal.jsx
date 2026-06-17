import React, { useState, useEffect, useCallback } from 'react';
import { postService } from '../services/api';
import { useAuthStore } from '../store';
import NotesPanel from './NotesPanel';

const UserProfileModal = ({ user: profileUser, onClose, onEditProfile }) => {
  const currentUser = useAuthStore((state) => state.user);
  const isOwn = String(currentUser?._id || '') === String(profileUser?._id || '');

  const [tab, setTab] = useState('updates');
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profileUser?._id) return;
    setLoading(true);
    postService.getUserPosts(profileUser._id)
      .then((data) => setPosts(data.posts || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [profileUser?._id]);

  const handleCreatePost = useCallback(async () => {
    if (!newPost.trim()) return;
    setSubmitting(true);
    try {
      const post = await postService.createPost(newPost.trim());
      setPosts((prev) => [post, ...prev]);
      setNewPost('');
    } catch (err) {
      console.error('Create post error:', err);
    } finally {
      setSubmitting(false);
    }
  }, [newPost]);

  const handleDeletePost = useCallback(async (postId) => {
    try {
      await postService.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      console.error('Delete post error:', err);
    }
  }, []);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Profile</h2>
            <div className="flex items-center gap-2">
              {isOwn && (
                <button onClick={() => { onEditProfile?.(); onClose(); }} className="text-xs text-blue-500 hover:text-blue-600 font-medium" type="button">
                  Edit Profile
                </button>
              )}
              <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" type="button">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center text-center">
            {profileUser?.avatar ? (
              <img src={profileUser.avatar} alt="" className="w-20 h-20 rounded-full object-cover border-4 border-blue-500" />
            ) : (
              <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-medium border-4 border-blue-500">
                {getInitials(profileUser?.name)}
              </div>
            )}
            <h3 className="mt-3 text-lg font-semibold text-gray-800 dark:text-white">{profileUser?.name}</h3>
            <p className="text-sm text-gray-500">{profileUser?.email}</p>
            {profileUser?.bio && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-sm">{profileUser.bio}</p>
            )}
          </div>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            <button
              onClick={() => setTab('updates')}
              className={`flex-1 py-3 text-sm font-medium text-center transition ${tab === 'updates' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              type="button"
            >Updates</button>
            <button
              onClick={() => setTab('notes')}
              className={`flex-1 py-3 text-sm font-medium text-center transition ${tab === 'notes' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              type="button"
            >Notes</button>
          </div>
        </div>

        <div className="p-6">
          {tab === 'updates' ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 dark:text-white">Updates</h3>
                {isOwn && (
                  <span className="text-xs text-gray-400">{posts.length} post{posts.length !== 1 ? 's' : ''}</span>
                )}
              </div>

              {isOwn && (
                <div className="mb-4 flex gap-2">
                  <input
                    type="text"
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="What's on your mind?"
                    maxLength={500}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreatePost(); }}
                  />
                  <button
                    onClick={handleCreatePost}
                    disabled={!newPost.trim() || submitting}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm shrink-0"
                    type="button"
                  >
                    {submitting ? '...' : 'Post'}
                  </button>
                </div>
              )}

              {loading ? (
                <div className="text-center text-gray-400 py-8 text-sm">Loading posts...</div>
              ) : posts.length === 0 ? (
                <div className="text-center text-gray-400 py-8 text-sm">
                  {isOwn ? 'You haven\'t posted anything yet.' : 'No updates yet.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {posts.map((post) => (
                    <div key={post._id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {post.user?.avatar ? (
                            <img src={post.user.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                              {getInitials(post.user?.name)}
                            </div>
                          )}
                          <span className="text-xs text-gray-500">{formatDate(post.createdAt)}</span>
                        </div>
                        {isOwn && (
                          <button
                            onClick={() => handleDeletePost(post._id)}
                            className="text-gray-400 hover:text-red-500 shrink-0"
                            type="button"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-gray-800 dark:text-white whitespace-pre-wrap">{post.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <NotesPanel profileUserId={profileUser?._id} isOwn={isOwn} />
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
