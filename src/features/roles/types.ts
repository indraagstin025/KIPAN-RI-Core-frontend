export interface RoleInfo {
  key: string;
  label: string;
  description: string;
}

export interface CapabilityInfo {
  key: string;
  label: string;
  description: string;
  roles: string[];
}

export interface RoleCatalog {
  roles: RoleInfo[];
  capabilities: CapabilityInfo[];
}
