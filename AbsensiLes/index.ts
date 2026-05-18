export type Role = 'admin' | 'tutor' | 'student' | 'parent';

export interface User {
    id: string;
    name: string;
    role: Role;
    phone?: string;
    email?: string;
}