import React, { useState, useEffect } from 'react';
import { messageService } from '../services/api';

const SharedMedia = ({ chatId }) => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('all');

  useEffect(() => {
    if (!chatId) return;
    setLoading(true);
    messageService.getMessages(chatId, 1, 200)
      .then((data) => {
        const msgs = data.messages || [];
        const filtered = msgs.filter((m) =>
          m.messageType === 'image' || m.messageType === 'file' || m.messageType === 'audio'
        );
        setMedia(filtered);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [chatId]);

  const filtered = type === 'all' ? media : media.filter((m) => m.messageType === type);

  if (loading) {
    return <div className="text-center text-gray-400 py-8 text-sm">Loading media...</div>;
  }

  if (media.length === 0) {
    return <div className="text-center text-gray-400 py-8 text-sm">No shared media yet.</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setType('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition ${type === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
          type="button"
        >All ({media.length})</button>
        <button
          onClick={() => setType('image')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition ${type === 'image' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
          type="button"
        >Images ({media.filter((m) => m.messageType === 'image').length})</button>
        <button
          onClick={() => setType('audio')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition ${type === 'audio' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
          type="button"
        >Audio ({media.filter((m) => m.messageType === 'audio').length})</button>
        <button
          onClick={() => setType('file')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition ${type === 'file' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
          type="button"
        >Files ({media.filter((m) => m.messageType === 'file').length})</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-400 py-8 text-sm">No {type === 'image' ? 'images' : type === 'audio' ? 'audio' : 'files'} found.</div>
        ) : (
          <div className={type === 'image' ? 'grid grid-cols-3 gap-2' : 'space-y-2'}>
            {filtered.map((item) => {
              if (item.messageType === 'image' && item.fileUrl) {
                return (
                  <a key={item._id} href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="block aspect-square">
                    <img src={item.fileUrl} alt="" className="w-full h-full object-cover rounded-lg hover:opacity-90 transition" />
                  </a>
                );
              }
              if (item.messageType === 'audio' && item.fileUrl) {
                return (
                  <div key={item._id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-2">{item.fileName || 'Voice message'}</p>
                    <audio src={item.fileUrl} controls className="w-full h-10" preload="metadata" />
                  </div>
                );
              }
              return (
                <a key={item._id} href={item.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <svg className="w-8 h-8 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{item.fileName || 'File'}</p>
                    <p className="text-xs text-gray-500">{item.content ? item.content.slice(0, 40) : ''}</p>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedMedia;
