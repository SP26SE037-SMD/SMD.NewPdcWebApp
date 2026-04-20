/**
 * Base configuration for API calls.
 * In a real project, this would handle:
 * - Base URL from environment variables
 * - Default Headers (Content-Type, etc.)
 * - Auth Interceptors (Adding the JWT token automatically)
 * - Error handling centralization
 */

const API_BASE_URL = ''; // Leave empty to use relative paths for BFF routes (/api/...)

export const apiClient = {
    async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            ...options,
        });
        return this.handleResponse(response);
    },

    async post<T>(endpoint: string, body: any, options?: RequestInit): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            body: JSON.stringify(body),
            ...options,
        });
        return this.handleResponse(response);
    },

    async put<T>(endpoint: string, body: any, options?: RequestInit): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            body: JSON.stringify(body),
            ...options,
        });
        return this.handleResponse(response);
    },

    async patch<T>(endpoint: string, body: any, options?: RequestInit): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            body: JSON.stringify(body),
            ...options,
        });
        return this.handleResponse(response);
    },

    async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            ...options,
        });
        return this.handleResponse(response);
    },

    async handleResponse(response: Response) {
        if (!response.ok) {
            let errorInfo = '';
            let errorData = null;
            try {
                errorData = await response.json();
                errorInfo = errorData.errors ? JSON.stringify(errorData.errors) : (errorData.message || JSON.stringify(errorData));
            } catch (e) {
                // If not JSON, get raw text (could be HTML error page)
                const text = await response.text().catch(() => '');
                errorInfo = `Status ${response.status}: ${text.slice(0, 200)}${text.length > 200 ? '...' : ''}`;
            }
            
            const error = new Error(`API Error | ${errorInfo}`) as any;
            error.status = response.status;
            error.data = errorData;

            // Handle Unauthorized globally
            if (response.status === 401) {
                if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                    window.location.href = '/login?reason=session_expired';
                    // We return a never resolving promise to stop execution of the caller since we are redirecting
                    return new Promise(() => { }) as any;
                }
            }

            throw error;
        }
        return response.json();
    }
};