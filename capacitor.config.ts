import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.ExplorePlus',
  appName: 'ExplorePlus',
  webDir: 'build',
  bundledWebRuntime: false,
  server: {
    url: 'http://192.168.0.186:5173', // Use the correct local IP and dev server port
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000, // Splash screen duration in milliseconds
      launchAutoHide: true,
      backgroundColor: '#ffffff', // Background color for the splash screen
      showSpinner: true,
      spinnerColor: '#000000', // Spinner color
    },
  },
};

export default config;
