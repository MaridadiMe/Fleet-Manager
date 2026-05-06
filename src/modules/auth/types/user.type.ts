export type User = {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  userName: string;
  permissions: string[];
  role: string;
  iat: number;
  exp: number;
};
