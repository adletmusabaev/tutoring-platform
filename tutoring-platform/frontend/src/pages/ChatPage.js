import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import * as chatService from '../services/chatService';

function ChatPage() {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typing, setTyping] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchChat();
  }, [bookingId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChat = async () => {
    try {
      setLoading(true);
      const data = await chatService.getChatByBooking(bookingId);
      setChat(data);
      setMessages(data.messages || []);
      console.log('✅ Chat loaded, messages count:', (data.messages || []).length);
      console.log('Messages:', data.messages);
    } catch (err) {
      console.error('❌ Failed to load chat:', err);
      setError('Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (socket && connected && bookingId) {
      console.log('📍 Joining chat room:', bookingId);
      socket.emit('join-chat', bookingId);

      socket.on('receive-message', (data) => {
  console.log('💬 Message received from socket:', data);
  setMessages(prev => {
    // Проверяем, есть ли уже это сообщение (чтобы избежать дубликатов)
    const exists = prev.some(msg => 
      msg.text === data.message && 
      msg.senderId === data.userId &&
      Math.abs(new Date(msg.timestamp) - new Date(data.timestamp)) < 1000
    );
    
    if (exists) {
      // Заменяем временное сообщение на подтверждённое
      return prev.map(msg => {
        if (msg._temp && msg.text === data.message && msg.senderId === data.userId) {
          return {
            senderId: data.userId,
            senderRole: data.userRole,
            text: data.message,
            timestamp: data.timestamp
          };
        }
        return msg;
      });
    }
    
    // Если не существует, добавляем новое
    return [...prev, {
      senderId: data.userId,
      senderRole: data.userRole,
      text: data.message,
      timestamp: data.timestamp
    }];
  });
});

      socket.on('user-typing', (data) => {
        console.log('⌨️ User typing:', data);
        setTyping(data.socketId);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTyping(null), 3000);
      });

      socket.on('user-stop-typing', () => {
        setTyping(null);
      });

      socket.on('error', (data) => {
        console.error('❌ Socket error:', data);
        setError(data.error || 'Socket error');
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error);
      });

      return () => {
        console.log('📍 Leaving chat room:', bookingId);
        socket.emit('leave-chat', bookingId);
        socket.off('receive-message');
        socket.off('user-typing');
        socket.off('user-stop-typing');
        socket.off('error');
        socket.off('connect_error');
      };
    }
  }, [socket, connected, bookingId]);

  const handleSendMessage = (e) => {
  e.preventDefault();

  console.log('🔴 handleSendMessage called');
  console.log('🔴 messageText:', messageText);
  console.log('🔴 socket:', socket);
  console.log('🔴 connected:', connected);
  console.log('🔴 bookingId:', bookingId);

  if (!messageText.trim()) {
    console.log('⚠️ Empty message');
    return;
  }

  if (!socket) {
    console.error('❌ Socket not initialized');
    setError('Chat not initialized. Please refresh the page.');
    return;
  }

  if (!connected) {
    console.error('❌ Socket not connected');
    setError('Not connected to chat server');
    return;
  }

  console.log('📤 Sending message:', messageText);
  console.log('📤 To bookingId:', bookingId);
  console.log('📤 User:', user.id, user.role);

  // Добавляем сообщение сразу в UI
  const tempMessage = {
    senderId: user.id,
    senderRole: user.role,
    text: messageText,
    timestamp: new Date(),
    _temp: true
  };
  
  setMessages(prev => [...prev, tempMessage]);

  // Отправляем на сервер
  const messageData = {
    bookingId: bookingId,
    userId: user.id,
    userRole: user.role,
    message: messageText
  };
  
  console.log('📤 Emitting send-message with data:', messageData);
  socket.emit('send-message', messageData);

  setMessageText('');
  
  // Удаляем временное сообщение через 5 секунд
  setTimeout(() => {
    setMessages(prev => prev.filter(msg => !msg._temp));
  }, 5000);
};

  const handleTyping = () => {
    if (socket && connected) {
      socket.emit('user-typing', bookingId);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (error || !chat) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error || 'Failed to load chat'}
      </div>
    );
  }
  

  const otherUser = user.role === 'student' ? chat.teacherId : chat.studentId;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4 flex items-center justify-between shadow">
        <div>
          <h1 className="text-2xl font-bold">{otherUser?.name || 'Chat'}</h1>
          <p className="text-sm text-gray-600 flex items-center gap-2">
            <span className={connected ? 'text-green-600' : 'text-gray-600'}>
              {connected ? '🟢 Online' : '⚪ Offline'}
            </span>
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.senderId === user.id
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white border border-gray-300 rounded-bl-none'
                }`}
              >
                <p className="break-words">{msg.text}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.senderId === user.id
                      ? 'text-blue-200'
                      : 'text-gray-500'
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}

        {typing && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-300 px-4 py-2 rounded-lg">
              <p className="text-sm text-gray-600">
                {otherUser?.name || 'User'} is typing...
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4 shadow">
        {error && (
          <div className="bg-red-100 text-red-700 px-3 py-2 rounded mb-3 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value);
              handleTyping();
            }}
            className="input-field flex-1"
            placeholder="Type a message..."
          />
          <button
            type="submit"
            disabled={!messageText.trim()}
            className="btn-primary px-6 py-2 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatPage;