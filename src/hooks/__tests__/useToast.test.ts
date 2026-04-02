// Category 2b: Unit Tests - useToast reducer
import { describe, it, expect } from 'vitest';
import { reducer } from '../use-toast';

describe('useToast reducer', () => {
    const initialState = { toasts: [] };

    it('should add a toast', () => {
        const toast = { id: '1', title: 'Test', open: true } as any;
        const state = reducer(initialState, { type: 'ADD_TOAST', toast });
        expect(state.toasts).toHaveLength(1);
        expect(state.toasts[0].id).toBe('1');
    });

    it('should limit toasts to TOAST_LIMIT (1)', () => {
        const toast1 = { id: '1', title: 'First', open: true } as any;
        const toast2 = { id: '2', title: 'Second', open: true } as any;

        let state = reducer(initialState, { type: 'ADD_TOAST', toast: toast1 });
        state = reducer(state, { type: 'ADD_TOAST', toast: toast2 });

        // TOAST_LIMIT is 1, so only the newest should remain
        expect(state.toasts).toHaveLength(1);
        expect(state.toasts[0].id).toBe('2');
    });

    it('should update an existing toast', () => {
        const toast = { id: '1', title: 'Original', open: true } as any;
        let state = reducer(initialState, { type: 'ADD_TOAST', toast });
        state = reducer(state, {
            type: 'UPDATE_TOAST',
            toast: { id: '1', title: 'Updated' },
        });

        expect(state.toasts[0].title).toBe('Updated');
    });

    it('should dismiss a specific toast', () => {
        const toast = { id: '1', title: 'Test', open: true } as any;
        let state = reducer(initialState, { type: 'ADD_TOAST', toast });
        state = reducer(state, { type: 'DISMISS_TOAST', toastId: '1' });

        expect(state.toasts[0].open).toBe(false);
    });

    it('should dismiss all toasts when no toastId given', () => {
        const toast = { id: '1', title: 'Test', open: true } as any;
        let state = reducer(initialState, { type: 'ADD_TOAST', toast });
        state = reducer(state, { type: 'DISMISS_TOAST' });

        expect(state.toasts[0].open).toBe(false);
    });

    it('should remove a specific toast', () => {
        const toast = { id: '1', title: 'Test', open: true } as any;
        let state = reducer(initialState, { type: 'ADD_TOAST', toast });
        state = reducer(state, { type: 'REMOVE_TOAST', toastId: '1' });

        expect(state.toasts).toHaveLength(0);
    });

    it('should remove all toasts when no toastId given', () => {
        const toast = { id: '1', title: 'Test', open: true } as any;
        let state = reducer(initialState, { type: 'ADD_TOAST', toast });
        state = reducer(state, { type: 'REMOVE_TOAST' });

        expect(state.toasts).toHaveLength(0);
    });

    it('should not update non-existent toast', () => {
        const toast = { id: '1', title: 'Original', open: true } as any;
        let state = reducer(initialState, { type: 'ADD_TOAST', toast });
        state = reducer(state, {
            type: 'UPDATE_TOAST',
            toast: { id: 'nonexistent', title: 'Nope' },
        });

        expect(state.toasts[0].title).toBe('Original');
    });
});
