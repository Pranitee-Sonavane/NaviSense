const API_URL = 'http://localhost:4000/api';

interface LoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
    organizationId: string;
  };
  organization: {
    id: string;
    name: string;
  };
  token: string;
  error?: string;
  status?: number;
}

interface RegisterResponse {
  user: {
    id: string;
    name: string;
    email: string;
    organizationId: string;
  };
  organization: {
    id: string;
    name: string;
  };
  token: string;
  error?: string;
  status?: number;
}

interface UserResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
    createdAt: string;
    updatedAt: string;
  };
  error?: string;
  status?: number;
}

// Store token in localStorage
export function setAuthToken(token: string) {
  localStorage.setItem('authToken', token);
}

// Get token from localStorage
export function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

// Remove token from localStorage
export function clearAuthToken() {
  localStorage.removeItem('authToken');
}

// Register new admin
export async function registerAdmin(
  email: string,
  password: string,
  name: string,
  organizationName: string
): Promise<RegisterResponse> {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name,
        organizationName,
      }),
    });

    const data = await response.json();

    if (response.ok && data.token) {
      setAuthToken(data.token);
    }

    return data;
  } catch (error) {
    console.error('Register error:', error);
    return { error: 'Failed to register', status: 500 } as RegisterResponse;
  }
}

// Login admin
export async function loginAdmin(email: string, password: string): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (response.ok && data.token) {
      setAuthToken(data.token);
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Failed to login', status: 500 } as LoginResponse;
  }
}

// Get current user info
export async function getCurrentUser(): Promise<UserResponse> {
  try {
    const token = getAuthToken();
    if (!token) {
      return { error: 'No token found', status: 401 } as UserResponse;
    }

    const response = await fetch(`${API_URL}/admin/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get user error:', error);
    return { error: 'Failed to get user', status: 500 } as UserResponse;
  }
}

// Logout
export function logout() {
  clearAuthToken();
}
