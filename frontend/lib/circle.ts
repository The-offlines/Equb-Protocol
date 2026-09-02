"use client";

import { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";

export const circleClient = typeof window === "undefined" ? null : new W3SSdk();

export function initCircle() {
  if (typeof window === "undefined") {
    return null;
  }

  const appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID ?? "";

  if (!appId) {
    return null;
  }

  circleClient?.setAppSettings({
    appId,
  });

  return circleClient;
}

export function authenticateUser(userToken: string, encryptionKey: string) {
  if (typeof window === "undefined") {
    return null;
  }

  initCircle();

  if (!circleClient) {
    return null;
  }

  circleClient.setAuthentication({
    userToken,
    encryptionKey,
  });

  return circleClient;
}
