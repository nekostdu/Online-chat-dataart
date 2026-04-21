import { Client, StompSubscription, IMessage } from '@stomp/stompjs';

type Handler = (payload: unknown) => void;

/**
 * Thin wrapper over @stomp/stompjs to keep a single shared connection.
 * Re-subscribes on reconnect, restores active subscriptions.
 */
export class WsClient {
  private client: Client | null = null;
  private subs = new Map<string, { sub?: StompSubscription; handler: Handler }>();
  private connected = false;
  private listeners = new Set<(connected: boolean) => void>();

  /** Throttle real DOM activity pings so we don't flood the server. */
  private readonly ACTIVITY_THROTTLE_MS = 10_000;
  private lastActivitySentAt = 0;

  connect() {
    if (this.client) return;

    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${proto}//${location.host}/ws`;

    this.client = new Client({
      brokerURL: url,
      reconnectDelay: 2000,
      heartbeatIncoming: 20000,
      heartbeatOutgoing: 20000,
      debug: () => {},
      onConnect: () => {
        this.connected = true;
        // Re-attach subscriptions.
        this.subs.forEach((entry, dest) => {
          entry.sub = this.client!.subscribe(dest, (msg: IMessage) => this.dispatch(msg, entry.handler));
        });
        // Tell the server we're here right now — further pings only on real user activity.
        this.lastActivitySentAt = 0;
        this.reportActivity();
        this.listeners.forEach(l => l(true));
      },
      onDisconnect: () => {
        this.connected = false;
        this.listeners.forEach(l => l(false));
      },
      onWebSocketClose: () => {
        this.connected = false;
        this.listeners.forEach(l => l(false));
      },
    });

    this.client.activate();
  }

  disconnect() {
    this.subs.clear();
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    this.connected = false;
  }

  subscribe(destination: string, handler: Handler): () => void {
    const entry = { handler } as { sub?: StompSubscription; handler: Handler };
    this.subs.set(destination, entry);
    if (this.client && this.client.connected) {
      entry.sub = this.client.subscribe(destination, msg => this.dispatch(msg, handler));
    }
    return () => {
      const cur = this.subs.get(destination);
      if (cur?.sub) cur.sub.unsubscribe();
      this.subs.delete(destination);
    };
  }

  onConnectionChange(cb: (connected: boolean) => void): () => void {
    this.listeners.add(cb);
    cb(this.connected);
    return () => { this.listeners.delete(cb); };
  }

  /**
   * Report that the user just did something (mousemove / keydown / click / scroll / etc).
   * Throttled: at most one ping per ACTIVITY_THROTTLE_MS.
   * Silently skipped when the tab is hidden or unfocused — otherwise background mouse
   * events would keep the user "online" forever (req 2.2.2).
   */
  reportActivity() {
    if (typeof document !== 'undefined') {
      if (document.hidden) return;
      if (typeof document.hasFocus === 'function' && !document.hasFocus()) return;
    }
    const now = Date.now();
    if (now - this.lastActivitySentAt < this.ACTIVITY_THROTTLE_MS) return;
    if (!this.client?.connected) return;
    this.lastActivitySentAt = now;
    this.client.publish({ destination: '/app/activity', body: '' });
  }

  private dispatch(msg: IMessage, handler: Handler) {
    try { handler(JSON.parse(msg.body)); }
    catch (e) { console.error('ws parse error', e); }
  }
}

export const ws = new WsClient();
