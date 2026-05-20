import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import * as chatService from '../services/chatService';

const API_ORIGIN = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

function ChatPage() {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [typing, setTyping] = useState(null);
  const [callOpen, setCallOpen] = useState(false);
  const [callStatus, setCallStatus] = useState('Звонок не начат');
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const normalizeMessage = useCallback((data) => ({
    senderId: data.userId || data.senderId,
    senderRole: data.userRole || data.senderRole,
    text: data.message || data.text || '',
    attachments: data.attachments || [],
    messageType: data.messageType || 'text',
    timestamp: data.timestamp || new Date()
  }), []);

  const fetchChat = useCallback(async () => {
    try {
      setLoading(true);
      const data = await chatService.getChatByBooking(bookingId);
      setChat(data);
      setMessages(data.messages || []);
    } catch (err) {
      setError(err?.error || 'Не удалось загрузить чат');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchChat();
  }, [fetchChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const cleanupCall = useCallback((notifyPeer = false) => {
    if (notifyPeer && socket && bookingId) {
      socket.emit('end-call', bookingId);
    }

    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    screenStreamRef.current = null;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setCallOpen(false);
    setCallStatus('Звонок завершен');
    setMicEnabled(true);
    setCameraEnabled(true);
    setScreenSharing(false);
    setRemoteConnected(false);
  }, [bookingId, socket]);

  const getLocalStream = useCallback(async () => {
    if (localStreamRef.current) {
      return localStreamRef.current;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    });
    localStreamRef.current = stream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    return stream;
  }, []);

  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', {
          bookingId,
          candidate: event.candidate
        });
      }
    };

    peerConnection.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
      setRemoteConnected(true);
    };

    peerConnection.onconnectionstatechange = () => {
      if (peerConnection.connectionState === 'connected') {
        setCallStatus('Вы в звонке');
      }
      if (['disconnected', 'failed', 'closed'].includes(peerConnection.connectionState)) {
        setRemoteConnected(false);
      }
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  }, [bookingId, socket]);

  const addLocalTracks = useCallback(async (peerConnection) => {
    const stream = await getLocalStream();
    stream.getTracks().forEach((track) => {
      const alreadyAdded = peerConnection.getSenders().some((sender) => sender.track === track);
      if (!alreadyAdded) {
        peerConnection.addTrack(track, stream);
      }
    });
  }, [getLocalStream]);

  const startCall = async () => {
    try {
      setError('');
      setCallOpen(true);
      setCallStatus('Идет вызов...');
      const peerConnection = createPeerConnection();
      await addLocalTracks(peerConnection);
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit('call-offer', { bookingId, offer });
    } catch (err) {
      setError('Не удалось начать звонок. Проверьте доступ к камере и микрофону.');
      cleanupCall(false);
    }
  };

  const answerCall = useCallback(async (offer) => {
    try {
      setError('');
      setCallOpen(true);
      setCallStatus('Подключение к звонку...');
      const peerConnection = createPeerConnection();
      await addLocalTracks(peerConnection);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit('call-answer', { bookingId, answer });
    } catch (err) {
      setError('Не удалось принять звонок. Проверьте доступ к камере и микрофону.');
      cleanupCall(false);
    }
  }, [addLocalTracks, bookingId, cleanupCall, createPeerConnection, socket]);

  useEffect(() => {
    if (!socket || !connected || !bookingId) {
      return undefined;
    }

    socket.emit('join-chat', bookingId);

    const handleReceiveMessage = (data) => {
      setMessages((prev) => [...prev.filter((msg) => !msg._temp), normalizeMessage(data)]);
    };

    const handleTypingEvent = (data) => {
      setTyping(data.socketId);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTyping(null), 3000);
    };

    const handleCallOffer = ({ offer }) => {
      answerCall(offer);
    };

    const handleCallAnswer = async ({ answer }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCallStatus('Вы в звонке');
      }
    };

    const handleIceCandidate = async ({ candidate }) => {
      if (peerConnectionRef.current && candidate) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    socket.on('receive-message', handleReceiveMessage);
    socket.on('user-typing', handleTypingEvent);
    socket.on('user-stop-typing', () => setTyping(null));
    socket.on('call-offer', handleCallOffer);
    socket.on('call-answer', handleCallAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('end-call', () => cleanupCall(false));
    socket.on('error', (data) => setError(data.error || 'Ошибка соединения'));

    return () => {
      socket.emit('leave-chat', bookingId);
      socket.off('receive-message', handleReceiveMessage);
      socket.off('user-typing', handleTypingEvent);
      socket.off('user-stop-typing');
      socket.off('call-offer', handleCallOffer);
      socket.off('call-answer', handleCallAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('end-call');
      socket.off('error');
    };
  }, [answerCall, bookingId, cleanupCall, connected, normalizeMessage, socket]);

  useEffect(() => () => cleanupCall(false), [cleanupCall]);

  const handleFileChange = (event) => {
    setSelectedFiles(Array.from(event.target.files || []));
  };

  const removeSelectedFile = (fileName) => {
    setSelectedFiles((prev) => prev.filter((file) => file.name !== fileName));
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();

    const text = messageText.trim();
    if (!text && selectedFiles.length === 0) {
      return;
    }

    if (!socket || !connected) {
      setError('Нет подключения к серверу чата');
      return;
    }

    try {
      setSending(true);
      setError('');
      let attachments = [];

      if (selectedFiles.length > 0) {
        const uploadResult = await chatService.uploadChatFiles(bookingId, selectedFiles);
        attachments = uploadResult.files || [];
      }

      const tempMessage = {
        senderId: user.id,
        senderRole: user.role,
        text,
        attachments,
        messageType: attachments.length > 0 ? (text ? 'mixed' : 'attachment') : 'text',
        timestamp: new Date(),
        _temp: true
      };

      setMessages((prev) => [...prev, tempMessage]);
      socket.emit('send-message', {
        bookingId,
        userId: user.id,
        userRole: user.role,
        message: text,
        attachments
      });

      setMessageText('');
      setSelectedFiles([]);
    } catch (err) {
      setError(err?.error || 'Не удалось отправить файл или сообщение');
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    if (socket && connected) {
      socket.emit('user-typing', bookingId);
    }
  };

  const toggleMic = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicEnabled(audioTrack.enabled);
    }
  };

  const toggleCamera = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCameraEnabled(videoTrack.enabled);
    }
  };

  const toggleScreenShare = async () => {
    try {
      const peerConnection = peerConnectionRef.current;
      const videoSender = peerConnection?.getSenders().find((sender) => sender.track?.kind === 'video');
      const cameraTrack = localStreamRef.current?.getVideoTracks()[0];

      if (screenSharing) {
        await videoSender?.replaceTrack(cameraTrack);
        screenStreamRef.current?.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
        setScreenSharing(false);
        return;
      }

      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      screenStreamRef.current = screenStream;

      await videoSender?.replaceTrack(screenTrack);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }

      screenTrack.onended = async () => {
        await videoSender?.replaceTrack(cameraTrack);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
        setScreenSharing(false);
      };

      setScreenSharing(true);
    } catch (err) {
      setError('Не удалось включить демонстрацию экрана');
    }
  };

  const fileUrl = (url) => {
    if (!url) return '#';
    return url.startsWith('http') ? url : `${API_ORIGIN}${url}`;
  };

  const renderAttachments = (attachments = [], isOwnMessage) => (
    <div className="mt-2 space-y-2">
      {attachments.map((file) => (
        <a
          key={`${file.url}-${file.originalName}`}
          href={fileUrl(file.url)}
          target="_blank"
          rel="noreferrer"
          className={`block rounded-md border p-2 text-sm ${
            isOwnMessage
              ? 'border-blue-300 bg-blue-500 text-white'
              : 'border-gray-200 bg-gray-50 text-gray-800'
          }`}
        >
          {file.fileType === 'image' ? (
            <img
              src={fileUrl(file.url)}
              alt={file.originalName}
              className="mb-2 max-h-48 w-full rounded object-cover"
            />
          ) : null}
          <span className="block break-words font-medium">{file.originalName}</span>
          <span className={isOwnMessage ? 'text-blue-100' : 'text-gray-500'}>
            {Math.max(1, Math.round((file.size || 0) / 1024))} KB
          </span>
        </a>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (error && !chat) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  const otherUser = user.role === 'student' ? chat?.teacherId : chat?.studentId;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b p-4 flex items-center justify-between shadow">
        <div>
          <h1 className="text-2xl font-bold">{otherUser?.name || 'Chat'}</h1>
          <p className="text-sm text-gray-600">
            {connected ? 'Online' : 'Offline'}
          </p>
        </div>
        <button
          type="button"
          onClick={startCall}
          disabled={!connected || callOpen}
          className="btn-primary disabled:opacity-50"
        >
          Начать звонок
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Сообщений пока нет. Начните переписку.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwnMessage = msg.senderId === user.id || msg.senderId?._id === user.id;
            return (
              <div
                key={`${msg.timestamp}-${index}`}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-sm px-4 py-2 rounded-lg ${
                    isOwnMessage
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white border border-gray-300 rounded-bl-none'
                  }`}
                >
                  {msg.text ? <p className="break-words">{msg.text}</p> : null}
                  {renderAttachments(msg.attachments, isOwnMessage)}
                  <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-200' : 'text-gray-500'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {typing && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-300 px-4 py-2 rounded-lg">
              <p className="text-sm text-gray-600">{otherUser?.name || 'User'} печатает...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t p-4 shadow">
        {error && (
          <div className="bg-red-100 text-red-700 px-3 py-2 rounded mb-3 text-sm">
            {error}
          </div>
        )}

        {selectedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedFiles.map((file) => (
              <div key={file.name} className="flex items-center gap-2 rounded border bg-gray-50 px-3 py-2 text-sm">
                <span className="max-w-[180px] truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeSelectedFile(file.name)}
                  className="text-red-600 hover:text-red-800"
                >
                  Убрать
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex flex-col gap-3 md:flex-row">
          <label className="btn-secondary cursor-pointer text-center">
            Файл
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          <input
            type="text"
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value);
              handleTyping();
            }}
            className="input-field flex-1"
            placeholder="Введите сообщение..."
          />
          <button
            type="submit"
            disabled={sending || (!messageText.trim() && selectedFiles.length === 0)}
            className="btn-primary px-6 py-2 disabled:opacity-50"
          >
            {sending ? 'Отправка...' : 'Отправить'}
          </button>
        </form>
      </div>

      {callOpen && (
        <div className="fixed inset-0 z-50 bg-gray-950/90 p-4 text-white">
          <div className="mx-auto flex h-full max-w-6xl flex-col">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Звонок с {otherUser?.name || 'собеседником'}</h2>
                <p className="text-sm text-gray-300">{remoteConnected ? 'Собеседник подключен' : callStatus}</p>
              </div>
              <button type="button" onClick={() => cleanupCall(true)} className="btn-danger">
                Завершить
              </button>
            </div>

            <div className="grid min-h-0 flex-1 gap-4 md:grid-cols-2">
              <div className="relative overflow-hidden rounded-lg bg-black">
                <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
                {!remoteConnected && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                    Ожидание собеседника
                  </div>
                )}
              </div>
              <div className="relative overflow-hidden rounded-lg bg-black">
                <video ref={localVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
                <div className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-sm">
                  {screenSharing ? 'Ваш экран' : 'Вы'}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={toggleMic} className="btn-secondary">
                {micEnabled ? 'Заглушить микрофон' : 'Вкл микрофон'}
              </button>
              <button type="button" onClick={toggleCamera} className="btn-secondary">
                {cameraEnabled ? 'Откл камеру' : 'Показать камеру'}
              </button>
              <button type="button" onClick={toggleScreenShare} className="btn-secondary">
                {screenSharing ? 'Откл демонстрацию' : 'Демонстрировать экран'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatPage;
