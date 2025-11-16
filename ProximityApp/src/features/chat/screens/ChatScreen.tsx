import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { MapStackParamList, ChatMessage } from '../../../types';
import { subscribeToMessages, sendMessage, markMessagesAsRead, deleteMessage } from '../../../services/firebase/chat';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns';

type ChatScreenRouteProp = RouteProp<MapStackParamList, 'ChatScreen'>;
type ChatScreenNavigationProp = StackNavigationProp<MapStackParamList, 'ChatScreen'>;

const ChatScreen: React.FC = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { chatId, otherUserId, otherUserName, otherUserPhoto } = route.params;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!chatId) return;

    console.log(`[ChatScreen] Subscribing to chat ${chatId}`);

    // Subscribe to messages
    const unsubscribe = subscribeToMessages(
      chatId,
      (newMessages) => {
        setMessages(newMessages);
        setLoading(false);

        // Mark unread messages as read
        const unreadIds = newMessages
          .filter(m => m.senderId === otherUserId && !m.read)
          .map(m => m.id);

        if (unreadIds.length > 0 && user?.uid) {
          markMessagesAsRead(chatId, unreadIds, user.uid).catch(console.error);
        }
      },
      50
    );

    return () => {
      console.log(`[ChatScreen] Unsubscribing from chat ${chatId}`);
      unsubscribe();
    };
  }, [chatId, otherUserId, user?.uid]);

  // Set header with user info
  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity
          style={styles.headerTitle}
          onPress={() => {
            // Navigate to profile when header is tapped
          }}
        >
          {otherUserPhoto ? (
            <Image source={{ uri: otherUserPhoto }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Icon name="account" size={24} color={theme.colors.textSecondary} />
            </View>
          )}
          <Text style={[styles.headerName, { color: theme.colors.text }]}>{otherUserName}</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, otherUserName, otherUserPhoto, theme]);

  const handleSend = async () => {
    if (!inputText.trim() || !user?.uid) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      await sendMessage(chatId, user.uid, otherUserId, textToSend, {
        displayName: user.displayName || '',
        photoURL: user.photoURL,
      });

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('[ChatScreen] Error sending message:', error);
      setInputText(textToSend); // Restore text on error
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = (messageId: string, isMe: boolean) => {
    if (!isMe) return; // Can only delete own messages

    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user?.uid) return;
            try {
              await deleteMessage(chatId, messageId, user.uid);
            } catch (error) {
              console.error('[ChatScreen] Error deleting message:', error);
              Alert.alert('Error', 'Could not delete message');
            }
          },
        },
      ]
    );
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.senderId === user?.uid;
    const showTimestamp = true; // Simplified - can add logic to show timestamps on some messages

    return (
      <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
        <TouchableOpacity
          onLongPress={() => handleDeleteMessage(item.id, isMe)}
          activeOpacity={0.7}
        >
          <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}>
            <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>
              {item.text}
            </Text>
            <View style={styles.messageFooter}>
              <Text style={[styles.messageTime, isMe ? styles.messageTimeMe : styles.messageTimeOther]}>
                {format(item.timestamp, 'HH:mm')}
              </Text>
              {isMe && (
                <Icon
                  name={item.read ? 'check-all' : 'check'}
                  size={14}
                  color={item.read ? '#4FC3F7' : 'rgba(255, 255, 255, 0.6)'}
                  style={styles.readIcon}
                />
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const styles = createStyles(theme);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Icon name="message-text-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Start the conversation!</Text>
          </View>
        )}
      />

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, sending && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={sending || !inputText.trim()}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Icon
                name="send"
                size={24}
                color={inputText.trim() ? '#ffffff' : theme.colors.textSecondary}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    headerTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    headerAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
    },
    headerAvatarPlaceholder: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerName: {
      fontSize: 18,
      fontWeight: '600',
    },
    messagesList: {
      padding: 16,
      flexGrow: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 8,
    },
    messageRow: {
      marginBottom: 12,
      flexDirection: 'row',
    },
    messageRowMe: {
      justifyContent: 'flex-end',
    },
    messageRowOther: {
      justifyContent: 'flex-start',
    },
    messageBubble: {
      maxWidth: '75%',
      padding: 12,
      borderRadius: 12,
    },
    messageBubbleMe: {
      backgroundColor: theme.colors.primary,
      borderBottomRightRadius: 4,
    },
    messageBubbleOther: {
      backgroundColor: theme.colors.surface,
      borderBottomLeftRadius: 4,
    },
    messageText: {
      fontSize: 16,
      lineHeight: 22,
    },
    messageTextMe: {
      color: '#ffffff',
    },
    messageTextOther: {
      color: theme.colors.text,
    },
    messageFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginTop: 4,
      gap: 4,
    },
    messageTime: {
      fontSize: 11,
    },
    messageTimeMe: {
      color: 'rgba(255, 255, 255, 0.7)',
    },
    messageTimeOther: {
      color: theme.colors.textSecondary,
    },
    readIcon: {
      marginLeft: 2,
    },
    inputContainer: {
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
    },
    input: {
      flex: 1,
      backgroundColor: theme.colors.background,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 16,
      color: theme.colors.text,
      maxHeight: 100,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
  });

export default ChatScreen;
