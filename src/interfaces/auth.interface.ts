export interface LoginResponse {
    error: boolean;
    loginToken: string;
    userId:   number;
    name:   string;
    email:   string;
    userGroupId?: number;
    message?: string; // Optional message field for errors or additional info
  }