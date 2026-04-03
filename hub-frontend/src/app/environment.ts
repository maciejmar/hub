export const environment = {
  production: false,
  // apiBaseUrl: 'https://ai-apps-portal-test.northeurope.cloudapp.azure.com/api/v1', // stara domena Azure VM
  // apiBaseUrl: 'https://10.112.32.19/portal/api/v1',  // stary adres IP sandbox
  apiBaseUrl: 'https://portal-ai.bank.com.pl/portal/api/v1',
  oidc: {
    issuer: 'https://login.microsoftonline.com/29bb5b9c-200a-4906-89ef-c651c86ab301/v2.0',
    clientId: 'e517ed53-e3c5-42b4-b8c9-e35974e369ee',
    scope: 'openid profile email',
    // redirectPath: '/index.html', // stara domena Azure VM
    redirectPath: '/portal/index.html',  // portal-ai.bank.com.pl + sandbox IP
  },
};
