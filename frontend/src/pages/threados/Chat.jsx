import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';

export default function Chat() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h2 className="text-lg font-semibold text-slate-700 mb-2">Conversations</h2>
      <p className="text-sm text-slate-400 max-w-sm mb-4">
        Open the chat workspace to message your team, react, pin, and turn messages into tasks.
      </p>
      <Button onClick={() => navigate('/')}>Open chat app</Button>
    </div>
  );
}
