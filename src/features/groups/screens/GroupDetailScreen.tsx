// Group Detail screen - placeholder

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { RouteProp } from '@react-navigation/native';
import { GroupsStackParamList } from '../../../types';

type GroupDetailScreenRouteProp = RouteProp<GroupsStackParamList, 'GroupDetail'>;

interface Props {
  route: GroupDetailScreenRouteProp;
}

const GroupDetailScreen: React.FC<Props> = ({ route }) => {
  const { theme } = useTheme();
  const { groupId } = route.params;

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Group Detail: {groupId}</Text>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    text: {
      fontSize: theme.typography.fontSize.lg,
      color: theme.colors.text,
    },
  });

export default GroupDetailScreen;
