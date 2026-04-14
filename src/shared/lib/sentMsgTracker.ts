/**
 * Tracks previews that the current user just sent so the global
 * conversation poller in MainLayout can skip firing a notification.
 */
const _sent = new Map<string, string>(); // convId → preview text

export function markSentPreview(convId: string, preview: string) {
  _sent.set(convId, preview);
}

export function consumeSentPreview(convId: string, preview: string): boolean {
  if (_sent.get(convId) === preview) {
    _sent.delete(convId);
    return true;
  }
  return false;
}
