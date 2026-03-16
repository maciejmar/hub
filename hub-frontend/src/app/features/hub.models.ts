export interface CatalogApp {
  id: string;
  name: string;
  description: string;
  url: string;
  required_roles: string;
  sort_order: number;
  is_active: boolean;
}

export interface HubApp {
  id: string;
  name: string;
  description: string;
  url: string;
}

export interface HubUser {
  sub: string;
  email: string;
  name: string;
  preferred_username: string;
}

export interface HubAppsResponse {
  user: HubUser;
  roles: string[];
  apps: HubApp[];
}
