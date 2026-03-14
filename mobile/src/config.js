import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};

export const API_URL = extra.apiUrl;
export const GOOGLE_WEB_CLIENT_ID = extra.googleWebClientId;
export const GOOGLE_ANDROID_CLIENT_ID = extra.googleAndroidClientId;
