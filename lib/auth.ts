// Simple auth simulation - In production, use proper authentication
import { User } from '@/types/order';

// Mock users database
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@nek.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    addresses: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    role: 'user',
    addresses: [],
    createdAt: new Date().toISOString(),
  },
];

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // In a real app, verify password hash
  // For demo: any password works
  // Case-insensitive email matching
  const normalizedEmail = email.toLowerCase().trim();
  const user = mockUsers.find((u) => u.email.toLowerCase() === normalizedEmail);
  return user || null;
}

export async function getUserById(id: string): Promise<User | null> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return mockUsers.find((u) => u.id === id) || null;
}

export async function createUser(
  email: string,
  firstName: string,
  lastName: string,
  password: string
): Promise<User> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const newUser: User = {
    id: String(mockUsers.length + 1),
    email,
    firstName,
    lastName,
    role: 'user',
    addresses: [],
    createdAt: new Date().toISOString(),
  };

  mockUsers.push(newUser);
  return newUser;
}

