import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.juntos.app',
  appName: 'Juntos',
  webDir: 'public',
  server: {
    // Si tu URL de Vercel tiene otro nombre, cámbiala aquí:
    url: 'https://juntos-platform.vercel.app',
    cleartext: true
  }
};

export default config;