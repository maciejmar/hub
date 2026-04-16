import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HubService } from '../hub.service';

@Component({
  selector: 'app-portainer-redirect',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#1a1a2e;color:#fff;font-family:sans-serif">
      <p>{{ message }}</p>
    </div>
  `,
})
export class PortainerRedirectComponent implements OnInit {
  message = 'Logowanie do Portainer...';

  constructor(private hubService: HubService) {}

  ngOnInit(): void {
    this.hubService.getPortainerToken().subscribe({
      next: ({ jwt }) => {
        localStorage.setItem('portainer.JWT', jwt);
        window.location.href = '/portainer/';
      },
      error: () => {
        this.message = 'Błąd logowania do Portainer.';
      },
    });
  }
}
