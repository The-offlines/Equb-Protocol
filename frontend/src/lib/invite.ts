export const INVITE_CODE_PATTERN = /^EQB-[A-F0-9]{4}$/;

export function normalizeInviteCode(value: string): string {
  const input = value.trim();
  if (!input) {
    return "";
  }

  try {
    const url = new URL(input, "https://equb.local");
    const queryCode = url.searchParams.get("code");
    const pathMatch = url.pathname.match(/\/join\/([^/?#]+)/i);
    return (queryCode ?? pathMatch?.[1] ?? input).trim().toUpperCase().replace(/\s+/g, "");
  } catch {
    return input.toUpperCase().replace(/\s+/g, "");
  }
}

export function getInviteCode(groupAddress: string): string {
  return `EQB-${groupAddress.slice(2, 6).toUpperCase()}`;
}

export function getInviteLink(origin: string, groupAddress: string): string {
  return `${origin}/join?code=${getInviteCode(groupAddress)}`;
}
