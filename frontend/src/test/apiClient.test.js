import { describe, expect, it } from 'vitest';
import { AxiosError } from 'axios';
import { errorMessage } from '@/api/client';
describe('errorMessage', () => {
    it('returns server-supplied error from response body', () => {
        const err = new AxiosError('Request failed', undefined, undefined, null, {
            status: 409, statusText: 'Conflict', headers: {},
            config: { headers: {} },
            data: { error: 'username already in use', status: 409 },
        });
        expect(errorMessage(err)).toBe('username already in use');
    });
    it('falls back to axios message if body missing', () => {
        const err = new AxiosError('Network Error');
        expect(errorMessage(err)).toBe('Network Error');
    });
    it('uses the provided fallback for plain errors', () => {
        expect(errorMessage(null, 'fallback')).toBe('fallback');
    });
});
