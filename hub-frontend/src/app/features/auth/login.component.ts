import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { OidcAuthService } from '../../core/auth/oidc-auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="login__header">
      <img src="assets/bgk-logo.png" alt="BGK" class="login__logo" />
    </header>
    <section class="login">
      <div class="login__card">
        <p class="login__kicker">Single Sign-On</p>
        <h1>Hub Aplikacji</h1>
        <p class="login__lead">
          Jedno logowanie, wiele narzedzi. Uwierzytelnianie realizuje Azure Entra.
        </p>
        <button class="login__btn" type="button" (click)="login()">
          Zaloguj przez SSO
        </button>
      </div>
    </section>
  `,
  styles: `
    .login {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
    }
    .login__card {
      width: min(560px, 100%);
      padding: 32px;
      border: 1px solid var(--line);
      border-radius: 18px;
      background:
        linear-gradient(165deg, rgba(56, 189, 248, 0.09), rgba(45, 212, 191, 0.04)),
        var(--surface);
      backdrop-filter: blur(8px);
      box-shadow: var(--shadow-lg);
    }
    .login__kicker {
      display: inline-block;
      margin: 0 0 10px;
      padding: 6px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: #dff9f2;
      background: linear-gradient(120deg, rgba(45, 212, 191, 0.32), rgba(56, 189, 248, 0.28));
      border: 1px solid rgba(56, 189, 248, 0.35);
    }
    h1 {
      margin: 0;
      font-size: clamp(30px, 4vw, 42px);
    }
    .login__lead {
      margin: 12px 0 24px;
      color: var(--text-muted);
      line-height: 1.5;
      max-width: 46ch;
    }
    .login__header {
      position: fixed;
      top: 0;
      left: 0;
      padding: 16px 24px;
    }
    .login__logo {
      height: 48px;
    }
    .login__btn {
      border: 0;
      border-radius: 12px;
      padding: 14px 20px;
      font-size: 16px;
      font-weight: 700;
      color: #fff;
      cursor: pointer;
      background: #dc2626;
      box-shadow: 0 12px 26px rgba(220, 38, 38, 0.35);
      transition: transform 140ms ease, box-shadow 140ms ease, filter 140ms ease;
    }
    .login__btn:hover {
      transform: translateY(-1px);
      filter: brightness(1.08);
      box-shadow: 0 16px 32px rgba(220, 38, 38, 0.42);
    }
    .login__btn:active {
      transform: translateY(0);
    }
  `,
})
export class LoginComponent {
  constructor(private readonly auth: OidcAuthService) {}

  login(): void {
    this.auth.login();
  }
}
