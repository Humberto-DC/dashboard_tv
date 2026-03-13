import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.conecta360.dashboardtv',
  appName: 'dashboard-tv',
  webDir: 'out', // Este diretório não será usado se a 'url' estiver ativa
  server: {
    url: "http://172.16.0.132:3000", // Aponta para o servidor Next.js na porta 3000
    cleartext: true, // Permite conexões http (não seguras)
    allowNavigation: ['*']
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      launchAutoHide: true,
      androidSplashResourceName: "splash_full",
      androidScaleType: "CENTER_CROP",
      showSpinner: false
    }
  }
};

export default config;
