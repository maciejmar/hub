export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:18000/api/v1',
  oidc: {
    issuer: 'http://localhost:8081/realms/hub',
    clientId: 'hub-frontend',
    scope: 'openid profile email',
    redirectPath: '/auth/callback',
  },
};
