export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:18000/api/v1',
  oidc: {
    issuer: 'https://login.microsoftonline.com/3cf0f665-a664-4ad7-a75f-520538df5523/v2.0',
    clientId: 'e517ed53-e3c5-42b4-b8c9-e35974e369ee',
    scope: 'openid profile email',
    redirectPath: '/index.html',
  },
};
