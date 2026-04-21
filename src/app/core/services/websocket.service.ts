import { Injectable, NgZone } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { Client, IMessage } from '@stomp/stompjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private client!: Client;
  private alertSubject = new Subject<any>();
  private deletedSubject = new Subject<number>();
  private connected = false;

  constructor(private zone: NgZone) {}

  connect(): void {
    if (this.connected) return;

    const wsUrl = environment.apiUrl.replace(/^http/, 'ws') + '/ws';

    this.client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 5000,
      debug: () => {},
    });

    this.client.onConnect = () => {
      this.connected = true;

      this.client.subscribe('/topic/alerts', (message: IMessage) => {
        this.zone.run(() => {
          this.alertSubject.next(JSON.parse(message.body));
        });
      });

      this.client.subscribe('/topic/alerts/deleted', (message: IMessage) => {
        this.zone.run(() => {
          this.deletedSubject.next(JSON.parse(message.body));
        });
      });
    };

    this.client.onDisconnect = () => {
      this.connected = false;
    };

    this.client.onStompError = () => {
      this.connected = false;
    };

    this.client.activate();
  }

  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.connected = false;
    }
  }

  get alertUpdates$(): Observable<any> {
    return this.alertSubject.asObservable();
  }

  get alertDeleted$(): Observable<number> {
    return this.deletedSubject.asObservable();
  }

  get isConnected(): boolean {
    return this.connected;
  }
}
