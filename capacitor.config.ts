import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.juntos.app',
  appName: 'JUNTOS Asistencia RD',
  webDir: 'public',
  server: {
    url: 'https://juntos-platform.vercel.app',
    cleartext: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#020617', // Fondo corporativo slate-950
      showSpinner: false
    }
  }
};

export default config;