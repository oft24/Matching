/// <reference types="vite/client" />

interface Window {
  matchingDesktop?: {
    isDesktop: boolean;
    platform: string;
    version: string;
    notify: (title: string, body: string) => Promise<boolean>;
  };
}
