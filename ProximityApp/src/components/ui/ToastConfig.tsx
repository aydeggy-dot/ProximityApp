import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BaseToast, ErrorToast, ToastConfig as ToastConfigType } from 'react-native-toast-message';
import { colors } from '../../theme';

export const toastConfig: ToastConfigType = {
  success: (props) => (
    <BaseToast
      {...props}
      style={[styles.toast, { borderLeftColor: colors.light.success }]}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <Icon name="check-circle" size={24} color={colors.light.success} />
        </View>
      )}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={[styles.toast, { borderLeftColor: colors.light.error }]}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <Icon name="alert-circle" size={24} color={colors.light.error} />
        </View>
      )}
    />
  ),
  info: (props) => (
    <BaseToast
      {...props}
      style={[styles.toast, { borderLeftColor: colors.light.info }]}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <Icon name="information" size={24} color={colors.light.info} />
        </View>
      )}
    />
  ),
  warning: (props) => (
    <BaseToast
      {...props}
      style={[styles.toast, { borderLeftColor: colors.light.warning }]}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <Icon name="alert" size={24} color={colors.light.warning} />
        </View>
      )}
    />
  ),
};

const styles = StyleSheet.create({
  toast: {
    borderLeftWidth: 5,
    height: 70,
    borderRadius: 12,
    marginTop: 10,
  },
  contentContainer: {
    paddingHorizontal: 15,
  },
  iconContainer: {
    justifyContent: 'center',
    paddingLeft: 15,
  },
  text1: {
    fontSize: 16,
    fontWeight: '600',
  },
  text2: {
    fontSize: 14,
    color: '#6b7280',
  },
});
