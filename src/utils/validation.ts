// Validation utility functions

import { REGEX } from '../constants';

export const validateEmail = (email: string): boolean => {
  return REGEX.EMAIL.test(email);
};

export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[]
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validatePhoneNumber = (phone: string): boolean => {
  return REGEX.PHONE.test(phone) && phone.length >= 10;
};

export const validateDisplayName = (name: string): boolean => {
  return name.trim().length >= 2 && name.trim().length <= 50;
};

export const validateGroupName = (name: string): boolean => {
  return name.trim().length >= 3 && name.trim().length <= 50;
};

export const validateURL = (url: string): boolean => {
  return REGEX.URL.test(url);
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};
