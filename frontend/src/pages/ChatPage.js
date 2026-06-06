import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import * as chatService from '../services/chatService';

const API_ORIGIN = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
const DEFAULT_ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

const getIceServers = () => {
  if (!process.env.REACT_APP_ICE_SERVERS) {
    return DEFAULT_ICE_SERVERS;
  }

  try {
    return JSON.parse(process.env.REACT_APP_ICE_SERVERS);
  } catch (err) {
    return DEFAULT_ICE_SERVERS;
  }
};

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
  const [callStatus, setCallStatus] = useState('Call not started');
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [incomingOffer, setIncomingOffer] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);

  const otherUser = user.role === 'student' ? chat?.teacherId : chat?.studentId;

  const playVideo = (videoElement) => {
    const playPromise = videoElement?.play?.();
    if (playPromise?.catch) {
      playPromise.catch(() => {});
    }
  };

  const attachLocalStream = useCallback((stream = localStreamRef.current) => {
    if (localVideoRef.current && stream) {
      localVideoRef.current.srcObject = stream;
      playVideo(localVideoRef.current);
    }
  }, []);

  const attachRemoteStream = useCallback((stream = remoteStreamRef.current) => {
    if (remoteVideoRef.current && stream) {
      remoteVideoRef.current.srcObject = stream;
      playVideo(remoteVideoRef.current);
    }
  }, []);

  const setLocalVideoElement = useCallback((node) => {
    localVideoRef.current = node;
    attachLocalStream(screenStreamRef.current || localStreamRef.current);
  }, [attachLocalStream]);

  const setRemoteVideoElement = useCallback((node) => {
    remoteVideoRef.current = node;
    attachRemoteStream();
  }, [attachRemoteStream]);

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
      setError(err?.error || 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchChat();
  }, [fetchChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    remoteStreamRef.current = null;
    screenStreamRef.current = null;
    pendingIceCandidatesRef.current = [];

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setCallOpen(false);
    setIncomingOffer(null);
    setCallStatus('Call ended');
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
    attachLocalStream(stream);
    return stream;
  }, [attachLocalStream]);

  const drainPendingIceCandidates = useCallback(async () => {
    const peerConnection = peerConnectionRef.current;
    if (!peerConnection?.remoteDescription) {
      return;
    }

    const candidates = pendingIceCandidatesRef.current;
    pendingIceCandidatesRef.current = [];

    for (const candidate of candidates) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }, []);

  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const peerConnection = new RTCPeerConnection({
      iceServers: getIceServers()
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
      remoteStreamRef.current = event.streams[0];
      attachRemoteStream(event.streams[0]);
      setRemoteConnected(true);
    };

    peerConnection.onconnectionstatechange = () => {
      if (peerConnection.connectionState === 'connected') {
        setCallStatus('In Call');
        setRemoteConnected(true);
      }

      if (['disconnected', 'failed', 'closed'].includes(peerConnection.connectionState)) {
        setRemoteConnected(false);
      }
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  }, [attachRemoteStream, bookingId, socket]);

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
      setIncomingOffer(null);
      setCallOpen(true);
      setCallStatus('Calling...');
      const peerConnection = createPeerConnection();
      await addLocalTracks(peerConnection);
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit('call-offer', { bookingId, offer });
    } catch (err) {
      setError('Failed to start call. Please check camera and microphone permissions.');
      cleanupCall(false);
    }
  };

  const answerCall = useCallback(async (offer) => {
    try {
      setError('');
      setCallOpen(true);
      setCallStatus('Connecting to call...');
      const peerConnection = createPeerConnection();
      await addLocalTracks(peerConnection);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      await drainPendingIceCandidates();
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit('call-answer', { bookingId, answer });
    } catch (err) {
      setError('Failed to accept call. Please check camera and microphone permissions.');
      cleanupCall(false);
    }
  }, [addLocalTracks, bookingId, cleanupCall, createPeerConnection, drainPendingIceCandidates, socket]);

  useEffect(() => {
    if (!socket || !connected || !bookingId) {
      return undefined;
    }

    socket.emit('join-chat', bookingId);

    // Message from ANOTHER user arriving in the room
    const handleReceiveMessage = (data) => {
      setMessages((prev) => [...prev, normalizeMessage(data)]);
    };

    // Confirmation that OUR OWN message was saved — replace the optimistic temp entry
    const handleMessageSent = (data) => {
      setMessages((prev) => [
        ...prev.filter((msg) => !msg._temp),
        normalizeMessage(data)
      ]);
    };

    const handleTypingEvent = (data) => {
      setTyping(data.socketId);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTyping(null), 3000);
    };

    const handleCallOffer = ({ offer }) => {
      setIncomingOffer(offer);
      setCallStatus('Incoming call');
    };

    const handleCallAnswer = async ({ answer }) => {
      if (!peerConnectionRef.current) {
        return;
      }

      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      await drainPendingIceCandidates();
      setCallStatus('In Call');
    };

    const handleIceCandidate = async ({ candidate }) => {
      if (!candidate) {
        return;
      }

      if (peerConnectionRef.current?.remoteDescription) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        return;
      }

      pendingIceCandidatesRef.current.push(candidate);
    };

    socket.on('receive-message', handleReceiveMessage);
    socket.on('message-sent', handleMessageSent);
    socket.on('user-typing', handleTypingEvent);
    socket.on('user-stop-typing', () => setTyping(null));
    socket.on('call-offer', handleCallOffer);
    socket.on('call-answer', handleCallAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('end-call', () => cleanupCall(false));
    socket.on('error', (data) => setError(data.error || 'Connection error'));

    return () => {
      socket.emit('leave-chat', bookingId);
      socket.off('receive-message', handleReceiveMessage);
      socket.off('message-sent', handleMessageSent);
      socket.off('user-typing', handleTypingEvent);
      socket.off('user-stop-typing');
      socket.off('call-offer', handleCallOffer);
      socket.off('call-answer', handleCallAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('end-call');
      socket.off('error');
    };
  }, [bookingId, cleanupCall, connected, drainPendingIceCandidates, normalizeMessage, socket]);

  useEffect(() => () => cleanupCall(false), [cleanupCall]);

  const acceptIncomingCall = async () => {
    if (!incomingOffer) {
      return;
    }

    const offer = incomingOffer;
    setIncomingOffer(null);
    await answerCall(offer);
  };

  const rejectIncomingCall = () => {
    setIncomingOffer(null);
    cleanupCall(true);
  };

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
      setError('Not connected to chat server');
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

      setMessages((prev) => [...prev, {
        senderId: user.id,
        senderRole: user.role,
        text,
        attachments,
        messageType: attachments.length > 0 ? (text ? 'mixed' : 'attachment') : 'text',
        timestamp: new Date(),
        _temp: true
      }]);

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
      setError(err?.error || 'Failed to send file or message');
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

      if (!videoSender || !cameraTrack) {
        setError('Please start a video call first.');
        return;
      }

      if (screenSharing) {
        await videoSender.replaceTrack(cameraTrack);
        screenStreamRef.current?.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
        attachLocalStream(localStreamRef.current);
        setScreenSharing(false);
        return;
      }

      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      screenStreamRef.current = screenStream;

      await videoSender.replaceTrack(screenTrack);
      attachLocalStream(screenStream);

      screenTrack.onended = async () => {
        await videoSender.replaceTrack(cameraTrack);
        attachLocalStream(localStreamRef.current);
        setScreenSharing(false);
      };

      setScreenSharing(true);
    } catch (err) {
      setError('Failed to share screen');
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

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b p-4 flex items-center justify-between shadow">
        <div>
          <h1 className="text-2xl font-bold">{otherUser?.name || 'Chat'}</h1>
          <p className="text-sm text-gray-600">{connected ? 'Online' : 'Offline'}</p>
        </div>
        <button
          type="button"
          onClick={startCall}
          disabled={!connected || callOpen}
          className="btn-primary disabled:opacity-50"
        >
          Start Call
        </button>
      </div>

      {incomingOffer && !callOpen && (
        <div className="border-b bg-blue-50 px-4 py-3 text-blue-900">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <span>Incoming call from {otherUser?.name || 'User'}</span>
            <div className="flex gap-2">
              <button type="button" onClick={acceptIncomingCall} className="btn-primary">
                Accept
              </button>
              <button type="button" onClick={rejectIncomingCall} className="btn-secondary">
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Start the conversation!</p>
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
              <p className="text-sm text-gray-600">{otherUser?.name || 'User'} is typing...</p>
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
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex flex-col gap-3 md:flex-row">
          <label className="btn-secondary cursor-pointer text-center">
            File
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
            placeholder="Type a message..."
          />
          <button
            type="submit"
            disabled={sending || (!messageText.trim() && selectedFiles.length === 0)}
            className="btn-primary px-6 py-2 disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>

      {callOpen && (
        <div className="fixed inset-0 z-50 bg-gray-950/90 p-4 text-white">
          <div className="mx-auto flex h-full max-w-6xl flex-col">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Call with {otherUser?.name || 'User'}</h2>
                <p className="text-sm text-gray-300">{remoteConnected ? 'Connected' : callStatus}</p>
              </div>
              <button type="button" onClick={() => cleanupCall(true)} className="btn-danger">
                End Call
              </button>
            </div>

            <div className="grid min-h-0 flex-1 gap-4 md:grid-cols-2">
              <div className="relative overflow-hidden rounded-lg bg-black">
                <video ref={setRemoteVideoElement} autoPlay playsInline className="h-full w-full object-cover" />
                {!remoteConnected && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                    Waiting for the other participant...
                  </div>
                )}
              </div>
              <div className="relative overflow-hidden rounded-lg bg-black">
                <video ref={setLocalVideoElement} autoPlay muted playsInline className="h-full w-full object-cover" />
                <div className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-sm">
                  {screenSharing ? 'Your Screen' : 'You'}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={toggleMic} className="btn-secondary">
                {micEnabled ? 'Mute Mic' : 'Unmute Mic'}
              </button>
              <button type="button" onClick={toggleCamera} className="btn-secondary">
                {cameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
              </button>
              <button type="button" onClick={toggleScreenShare} className="btn-secondary">
                {screenSharing ? 'Stop Presenting' : 'Share Screen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatPage;
