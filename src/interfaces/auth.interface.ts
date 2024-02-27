export interface User {
    loginToken: string;
    userId:   number;
    name:   string;
    email:   string;
    userGroupId?: number;
    sharedToken?:string
    message?: string; // Optional message field for errors or additional info
}