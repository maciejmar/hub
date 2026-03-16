export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:18000/api/v1',
  oidc: {
    issuer: 'https://login.microsoftonline.com/3cf0f665-a664-4ad7-a75f-520538df5523/v2.0',
    clientId: '4fe1d350-b8b4-4c0b-988d-0323acdf8175',
    scope: 'openid profile email api://4fe1d350-b8b4-4c0b-988d-0323acdf8175/access_as_user',
    redirectPath: '/auth/callback',
  },
};
