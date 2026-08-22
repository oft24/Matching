/// <reference types="vite/client" />

interface Window {
  q2playDesktop?: {
    isDesktop: boolean;
    platform: string;
    version: string;
    notify: (title: string, body: string) => Promise<boolean>;
  };
}
