import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'books.onboarded.v1';

export async function isOnboarded(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEY)) === '1';
}

export async function setOnboarded(): Promise<void> {
  await AsyncStorage.setItem(KEY, '1');
}
