import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';

import { OidcAuthService } from '../../core/auth/oidc-auth.service';
import { environment } from '../../environment';

const SCRIPT_NAMES: Record<string, string> = {
  hf: 'HuggingFace Model Manager',
};

@Component({
  selector: 'app-script-terminal',
  standalone: true,
  imports: [],
  styles: `
    .st {
      height: 100vh;
      background: #0d0d0d;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .st__header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 24px;
      background: #1a1a2e;
      border-bottom: 1px solid #333;
      flex-shrink: 0;
    }
    .st__back {
      background: none;
      border: 1px solid #444;
      color: #fff;
      border-radius: 8px;
      padding: 8px 16px;
      cursor: pointer;
      font-size: 14px;
    }
    .st__back:hover { background: #333; }
    .st__title { font-size: 18px; font-weight: 600; color: #fff; margin: 0; }
    .st__body {
      flex: 1;
      padding: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .st__terminal {
      flex: 1;
      overflow: hidden;
    }
  `,
  template: `
    <div class="st">
      <div class="st__header">
        <button class="st__back" (click)="goBack()">← Powrót</button>
        <h1 class="st__title">{{ scriptName }}</h1>
      </div>
      <div class="st__body">
        <div #terminalEl class="st__terminal"></div>
      </div>
    </div>
  `,
})
export class ScriptTerminalComponent implements AfterViewInit, OnDestroy {
  @ViewChild('terminalEl') terminalEl!: ElementRef<HTMLDivElement>;

  scriptName = '';
  private scriptId = '';
  private terminal!: Terminal;
  private fitAddon!: FitAddon;
  private ws: WebSocket | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: OidcAuthService,
  ) {}

  ngAfterViewInit(): void {
    this.scriptId = this.route.snapshot.paramMap.get('id') ?? '';
    this.scriptName = SCRIPT_NAMES[this.scriptId] ?? this.scriptId;

    this.terminal = new Terminal({
      theme: {
        background: '#0d0d0d',
        foreground: '#e0e0e0',
        cursor: '#e0e0e0',
      },
      fontFamily: '"Cascadia Code", "Courier New", monospace',
      fontSize: 14,
      lineHeight: 1.4,
      cursorBlink: true,
      scrollback: 5000,
    });

    this.fitAddon = new FitAddon();
    this.terminal.loadAddon(this.fitAddon);
    this.terminal.open(this.terminalEl.nativeElement);
    this.fitAddon.fit();

    window.addEventListener('resize', this.onWindowResize);

    this.connectWs();
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onWindowResize);
    this.ws?.close();
    this.terminal?.dispose();
  }

  goBack(): void {
    this.router.navigate(['/centrum-dowodzenia']);
  }

  private onWindowResize = (): void => {
    this.fitAddon?.fit();
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'resize',
        cols: this.terminal.cols,
        rows: this.terminal.rows,
      }));
    }
  };

  private connectWs(): void {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const base = environment.apiBaseUrl.replace(/^https?:/, proto);
    const url = `${base}/terminal/${this.scriptId}`;

    this.ws = new WebSocket(url);
    this.ws.binaryType = 'arraybuffer';

    this.ws.onopen = () => {
      const token = this.authService.getAccessToken();
      this.ws!.send(JSON.stringify({ token }));
    };

    this.ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        this.terminal.write(new Uint8Array(event.data));
      } else {
        this.terminal.write(event.data as string);
      }
    };

    this.ws.onclose = () => {
      this.terminal.write('\r\n\x1b[33m[Połączenie zamknięte]\x1b[0m\r\n');
    };

    this.ws.onerror = () => {
      this.terminal.write('\r\n\x1b[31m[Błąd połączenia WebSocket]\x1b[0m\r\n');
    };

    this.terminal.onData((data) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(new TextEncoder().encode(data));
      }
    });
  }
}
