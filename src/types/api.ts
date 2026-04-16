/**
 * Generic API response structure.
 */
export interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
}

export interface ApiResponseWithoutData {
    status: number;
    message: string;
}

/**
 * Common structure for paginated results.
 */
export interface PageableResponse<T> {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}
