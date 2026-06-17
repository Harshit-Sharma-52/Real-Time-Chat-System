import React, { useEffect, useState, useRef } from 'react';

const FriendNotification = ({ updates, onClear }) => {
  const [current, setCurrent] = useState(null);
  const seenRef = useRef(0);

  useEffect(() => {
    if (updates.length < seenRef.current) {
      seenRef.current = 0;
    }
    if (updates.length > seenRef.current && !current) {
      const next = updates[seenRef.current];
      setCurrent(next);
      const timer = setTimeout(() => {
        setCurrent(null);
        seenRef.current += 1;
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [updates, current]);

  if (!current) return null;

  const typeLabel = current.type === 'note' ? 'added a note' : 'posted an update';

  return (
    <div className="fixed top-4 right-4 z-[100] max-w-sm animate-slide-in">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 flex items-start gap-3">
        {current.user?.avatar ? (
          <img src={current.user.avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0">
            {current.user?.name?.[0] || '?'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 dark:text-white">{current.user?.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {typeLabel}
            {current.title && <>: <span className="font-medium">{current.title}</span></>}
          </p>
          {current.content && (
            <p className="text-xs text-gray-400 mt-1 truncate">{current.content}</p>
          )}
        </div>
        <button onClick={onClear} className="text-gray-400 hover:text-gray-600 shrink-0" type="button">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default FriendNotification;
