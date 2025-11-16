// Chat service for real-time messaging
import firestore from '@react-native-firebase/firestore';
import { Chat, ChatMessage } from '../../types';

const COLLECTIONS = {
  CHATS: 'chats',
  MESSAGES: 'messages',
  USERS: 'users',
};

/**
 * Generate chat ID from two user IDs (sorted alphabetically for consistency)
 */
export const generateChatId = (userId1: string, userId2: string): string => {
  return [userId1, userId2].sort().join('_');
};

/**
 * Create or get existing chat between two users
 * @param currentUserId - Current user ID
 * @param otherUserId - Other user ID
 * @param currentUserProfile - Current user profile info
 * @param otherUserProfile - Other user profile info
 */
export const createOrGetChat = async (
  currentUserId: string,
  otherUserId: string,
  currentUserProfile: { displayName: string; photoURL?: string; profilePicture?: string },
  otherUserProfile: { displayName: string; photoURL?: string; profilePicture?: string }
): Promise<Chat> => {
  const chatId = generateChatId(currentUserId, otherUserId);
  console.log(`[Chat] Creating or getting chat: ${chatId}`);

  try {
    const chatRef = firestore().collection(COLLECTIONS.CHATS).doc(chatId);
    const chatDoc = await chatRef.get();

    if (chatDoc.exists) {
      console.log(`[Chat] ✓ Chat already exists`);
      return {
        id: chatDoc.id,
        ...chatDoc.data(),
        createdAt: chatDoc.data()?.createdAt?.toDate(),
        updatedAt: chatDoc.data()?.updatedAt?.toDate(),
        lastMessageTimestamp: chatDoc.data()?.lastMessageTimestamp?.toDate(),
      } as Chat;
    }

    // Create new chat
    const now = firestore.FieldValue.serverTimestamp();
    const newChat: Partial<Chat> = {
      id: chatId,
      participants: [currentUserId, otherUserId].sort() as [string, string],
      participantProfiles: {
        [currentUserId]: currentUserProfile,
        [otherUserId]: otherUserProfile,
      },
      unreadCount: {
        [currentUserId]: 0,
        [otherUserId]: 0,
      },
      createdAt: now as any,
      updatedAt: now as any,
    };

    await chatRef.set(newChat);
    console.log(`[Chat] ✓ New chat created`);

    return {
      ...newChat,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Chat;
  } catch (error) {
    console.error('[Chat] Error creating/getting chat:', {
      chatId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Send a text message
 * @param chatId - Chat ID
 * @param senderId - Sender user ID
 * @param receiverId - Receiver user ID
 * @param text - Message text
 * @param senderProfile - Sender profile info
 */
export const sendMessage = async (
  chatId: string,
  senderId: string,
  receiverId: string,
  text: string,
  senderProfile?: { displayName: string; photoURL?: string }
): Promise<ChatMessage> => {
  console.log(`[Chat] Sending message in chat ${chatId}`);

  try {
    const chatRef = firestore().collection(COLLECTIONS.CHATS).doc(chatId);
    const messagesRef = chatRef.collection(COLLECTIONS.MESSAGES);

    // Create message
    const now = firestore.FieldValue.serverTimestamp();
    const messageData: Partial<ChatMessage> = {
      chatId,
      senderId,
      receiverId,
      text,
      timestamp: now as any,
      read: false,
      type: 'text',
      senderName: senderProfile?.displayName,
      senderPhoto: senderProfile?.photoURL,
    };

    // Add message to subcollection
    const messageRef = await messagesRef.add(messageData);

    // Update chat document with last message info
    await chatRef.update({
      lastMessage: text,
      lastMessageTimestamp: now,
      lastMessageSenderId: senderId,
      updatedAt: now,
      [`unreadCount.${receiverId}`]: firestore.FieldValue.increment(1),
    });

    console.log(`[Chat] ✓ Message sent: ${messageRef.id}`);

    return {
      id: messageRef.id,
      ...messageData,
      timestamp: new Date(),
    } as ChatMessage;
  } catch (error) {
    console.error('[Chat] Error sending message:', {
      chatId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Subscribe to messages in a chat (real-time)
 * @param chatId - Chat ID
 * @param onMessagesUpdate - Callback when messages change
 * @param limit - Number of recent messages to fetch (default: 50)
 * @returns Unsubscribe function
 */
export const subscribeToMessages = (
  chatId: string,
  onMessagesUpdate: (messages: ChatMessage[]) => void,
  limit: number = 50
): (() => void) => {
  console.log(`[Chat] Subscribing to messages in chat ${chatId}`);

  const unsubscribe = firestore()
    .collection(COLLECTIONS.CHATS)
    .doc(chatId)
    .collection(COLLECTIONS.MESSAGES)
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .onSnapshot(
      snapshot => {
        const messages: ChatMessage[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate(),
          readAt: doc.data().readAt?.toDate(),
        })) as ChatMessage[];

        console.log(`[Chat] ✓ Received ${messages.length} messages`);
        onMessagesUpdate(messages.reverse()); // Reverse to show oldest first
      },
      error => {
        console.error('[Chat] Error subscribing to messages:', error);
      }
    );

  return unsubscribe;
};

/**
 * Subscribe to user's chats (real-time)
 * @param userId - User ID
 * @param onChatsUpdate - Callback when chats change
 * @returns Unsubscribe function
 */
export const subscribeToChats = (
  userId: string,
  onChatsUpdate: (chats: Chat[]) => void
): (() => void) => {
  console.log(`[Chat] Subscribing to chats for user ${userId}`);

  const unsubscribe = firestore()
    .collection(COLLECTIONS.CHATS)
    .where('participants', 'array-contains', userId)
    .orderBy('updatedAt', 'desc')
    .onSnapshot(
      snapshot => {
        const chats: Chat[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          lastMessageTimestamp: doc.data().lastMessageTimestamp?.toDate(),
        })) as Chat[];

        console.log(`[Chat] ✓ Received ${chats.length} chats`);
        onChatsUpdate(chats);
      },
      error => {
        console.error('[Chat] Error subscribing to chats:', error);
      }
    );

  return unsubscribe;
};

/**
 * Mark messages as read
 * @param chatId - Chat ID
 * @param messageIds - Array of message IDs to mark as read
 * @param userId - Current user ID
 */
export const markMessagesAsRead = async (
  chatId: string,
  messageIds: string[],
  userId: string
): Promise<void> => {
  console.log(`[Chat] Marking ${messageIds.length} messages as read`);

  try {
    const batch = firestore().batch();
    const chatRef = firestore().collection(COLLECTIONS.CHATS).doc(chatId);
    const messagesRef = chatRef.collection(COLLECTIONS.MESSAGES);

    // Update each message
    messageIds.forEach(messageId => {
      const messageRef = messagesRef.doc(messageId);
      batch.update(messageRef, {
        read: true,
        readAt: firestore.FieldValue.serverTimestamp(),
      });
    });

    // Reset unread count for current user
    batch.update(chatRef, {
      [`unreadCount.${userId}`]: 0,
    });

    await batch.commit();
    console.log(`[Chat] ✓ Messages marked as read`);
  } catch (error) {
    console.error('[Chat] Error marking messages as read:', {
      chatId,
      messageIds,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Delete a chat and all its messages
 * @param chatId - Chat ID
 */
export const deleteChat = async (chatId: string): Promise<void> => {
  console.log(`[Chat] Deleting chat ${chatId}`);

  try {
    const chatRef = firestore().collection(COLLECTIONS.CHATS).doc(chatId);
    const messagesSnapshot = await chatRef.collection(COLLECTIONS.MESSAGES).get();

    // Delete all messages
    const batch = firestore().batch();
    messagesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete chat document
    batch.delete(chatRef);

    await batch.commit();
    console.log(`[Chat] ✓ Chat deleted`);
  } catch (error) {
    console.error('[Chat] Error deleting chat:', {
      chatId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Get unread message count for a user across all chats
 * @param userId - User ID
 * @returns Total unread count
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  try {
    const chatsSnapshot = await firestore()
      .collection(COLLECTIONS.CHATS)
      .where('participants', 'array-contains', userId)
      .get();

    let totalUnread = 0;
    chatsSnapshot.docs.forEach(doc => {
      const chat = doc.data() as Chat;
      totalUnread += chat.unreadCount[userId] || 0;
    });

    return totalUnread;
  } catch (error) {
    console.error('[Chat] Error getting unread count:', error);
    return 0;
  }
};

/**
 * Delete a message
 * @param chatId - Chat ID
 * @param messageId - Message ID to delete
 * @param userId - User ID requesting deletion (must be sender)
 */
export const deleteMessage = async (
  chatId: string,
  messageId: string,
  userId: string
): Promise<void> => {
  console.log(`[Chat] Deleting message ${messageId} from chat ${chatId}`);

  try {
    const chatRef = firestore().collection(COLLECTIONS.CHATS).doc(chatId);
    const messageRef = chatRef.collection(COLLECTIONS.MESSAGES).doc(messageId);

    // Get message to verify sender
    const messageDoc = await messageRef.get();
    if (!messageDoc.exists) {
      throw new Error('Message not found');
    }

    const message = messageDoc.data() as ChatMessage;
    if (message.senderId !== userId) {
      throw new Error('Not authorized to delete this message');
    }

    // Delete message
    await messageRef.delete();

    // Update chat's last message if this was the last message
    const chat = await chatRef.get();
    const chatData = chat.data() as Chat;

    if (chatData.lastMessageSenderId === userId && chatData.lastMessage === message.text) {
      // Get the new last message
      const lastMessageSnapshot = await chatRef
        .collection(COLLECTIONS.MESSAGES)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

      if (!lastMessageSnapshot.empty) {
        const lastMessage = lastMessageSnapshot.docs[0].data() as ChatMessage;
        await chatRef.update({
          lastMessage: lastMessage.text,
          lastMessageTimestamp: lastMessage.timestamp,
          lastMessageSenderId: lastMessage.senderId,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      } else {
        // No messages left
        await chatRef.update({
          lastMessage: firestore.FieldValue.delete(),
          lastMessageTimestamp: firestore.FieldValue.delete(),
          lastMessageSenderId: firestore.FieldValue.delete(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    console.log(`[Chat] ✓ Message deleted`);
  } catch (error) {
    console.error('[Chat] Error deleting message:', {
      chatId,
      messageId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};
