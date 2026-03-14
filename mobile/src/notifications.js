import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'note_notification_ids';
const CHANNEL_ID = 'reminders';

// Show notification even when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function setupNotifications() {
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    vibrationPattern: [0, 500, 200, 500],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true,
  });

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function _loadMap() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function _saveMap(map) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export async function scheduleReminder(noteId, remindAt, content) {
  if (!remindAt) return;
  const triggerDate = new Date(remindAt * 1000);
  if (triggerDate <= new Date()) return;

  // Cancel any existing notification for this note
  await cancelReminder(noteId);

  const notifId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Reminder',
      body: content,
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.MAX,
      sticky: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: CHANNEL_ID,
    },
  });

  const map = await _loadMap();
  map[String(noteId)] = notifId;
  await _saveMap(map);
}

export async function cancelReminder(noteId) {
  const map = await _loadMap();
  const notifId = map[String(noteId)];
  if (notifId) {
    await Notifications.cancelScheduledNotificationAsync(notifId);
    delete map[String(noteId)];
    await _saveMap(map);
  }
}
