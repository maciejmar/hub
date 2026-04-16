import { Component, OnInit } from '@angular/core';
import { environment } from '../../environment';

@Component({
  selector: 'app-portainer-redirect',
  standalone: true,
  imports: [],
  template: `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#1a1a2e;color:#fff;font-family:sans-serif">
      <p>Logowanie do Portainer...</p>
    </div>
  `,
})
export class PortainerRedirectComponent implements OnInit {
  ngOnInit(): void {
    window.location.href = `${environment.apiBaseUrl}/hub/portainer-login`;
  }
}
