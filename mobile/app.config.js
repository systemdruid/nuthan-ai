export default {
  expo: {
    name: "Recallio AI",
    slug: "recallio-ai",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "recallio",
    userInterfaceStyle: "light",
    android: {
      adaptiveIcon: {
        backgroundColor: "#1a1a2e",
      },
      package: "com.recallio.ai",
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "com.googleusercontent.apps.844770824008-s7eg3so96ft614gebuuudnbj9guld0uf",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },
    plugins: [
      "expo-web-browser",
      "expo-notifications",
      "@react-native-community/datetimepicker",
    ],
    extra: {
      apiUrl: process.env.API_URL,
      googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID,
      googleAndroidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID,
      eas: {
        projectId: "33560c9c-e5f3-41c0-ab2c-59ebe51026c0",
      },
    },
  },
};
