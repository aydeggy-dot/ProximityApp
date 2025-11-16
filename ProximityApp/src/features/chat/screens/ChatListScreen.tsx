import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { ChatsStackParamList, Chat } from '../../../types';
import { subscribeToChats } from '../../../services/firebase/chat';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatDistanceToNow } from 'date-fns';

type ChatListNavigationProp = StackNavigationProp<ChatsStackParamList, 'ChatList'>;

const ChatListScreen: React.FC = () => {
  const navigation = useNavigation<ChatListNavigationProp>();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    console.log(`[ChatList] Subscribing to chats for user ${user.uid}`);

    const unsubscribe = subscribeToChats(user.uid, (newChats) => {
      setChats(newChats);
      setLoading(false);
    });

    return () => {
      console.log('[ChatList] Unsubscribing from chats');
      unsubscribe();
    };
  }, [user?.uid]);

  const handleChatPress = (chat: Chat) => {
    const otherUserId = chat.participants.find(id => id !== user?.uid);
    if (!otherUserId) return;

    const otherUserProfile = chat.participantProfiles[otherUserId];

    navigation.navigate('ChatScreen', {
      chatId: chat.id,
      otherUserId,
      otherUserName: otherUserProfile?.displayName || 'User',
      otherUserPhoto: otherUserProfile?.profilePicture || otherUserProfile?.photoURL,
    });
  };

  const renderChat = ({ item }: { item: Chat }) => {
    const otherUserId = item.participants.find(id => id !== user?.uid);
    if (!otherUserId) return null;

    const otherUserProfile = item.participantProfiles[otherUserId];
    const unreadCount = user?.uid ? item.unreadCount[user.uid] || 0 : 0;
    const profileImage = otherUserProfile?.profilePicture || otherUserProfile?.photoURL;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => handleChatPress(item)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Icon name="account" size={32} color={theme.colors.textSecondary} />
          </View>
        )}

        {/* Chat Info */}
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>
              {otherUserProfile?.displayName || 'User'}
            </Text>
            {item.lastMessageTimestamp && (
              <Text style={styles.chatTime}>
                {formatDistanceToNow(item.lastMessageTimestamp, { addSuffix: false })}
              </Text>
            )}
          </View>

          <View style={styles.chatFooter}>
            <Text
              style={[styles.lastMessage, unreadCount > 0 && styles.lastMessageUnread]}
              numberOfLines={1}
            >
              {item.lastMessageSenderId === user?.uid && ''}
              {item.lastMessage || 'No messages yet'}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
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
    <View style={styles.container}>
      <FlatList
        data={chats}
        renderItem={renderChat}
        keyExtractor={(item) => item.id}
        contentContainerStyle={chats.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Icon name="message-text-outline" size={80} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>No chats yet</Text>
            <Text style={styles.emptySubtext}>
              Tap on a member from the map to start chatting
            </Text>
          </View>
        )}
      />
    </View>
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
    emptyContainer: {
      flex: 1,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyText: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: 20,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
    },
    chatItem: {
      flexDirection: 'row',
      padding: 16,
      backgroundColor: theme.colors.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.surface,
    },
    avatarPlaceholder: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    chatInfo: {
      flex: 1,
      marginLeft: 12,
      justifyContent: 'center',
    },
    chatHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    chatName: {
      fontSize: 17,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
      marginRight: 8,
    },
    chatTime: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    chatFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    lastMessage: {
      fontSize: 15,
      color: theme.colors.textSecondary,
      flex: 1,
      marginRight: 8,
    },
    lastMessageUnread: {
      color: theme.colors.text,
      fontWeight: '600',
    },
    unreadBadge: {
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
    },
    unreadText: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: '700',
    },
  });

export default ChatListScreen;
