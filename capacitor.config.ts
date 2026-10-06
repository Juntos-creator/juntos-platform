import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.juntos.app',
  appName: 'JUNTOS Asistencia RD',
  webDir: 'out',
  server: {
    url: 'https://juntos-platform.vercel.app',
    cleartext: false,
    allowNavigation: [
      'juntos-platform.vercel.app',
      '*.supabase.co',
      '*.google.com',
      '*.googleapis.com',
      'wa.me',
      'api.whatsapp.com'
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#020617',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    }
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  ios: {
    contentInset: 'always',
    preferredContentMode: 'mobile',
    scheme: 'JuntosApp'
  }
};

export default config;