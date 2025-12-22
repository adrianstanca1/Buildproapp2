import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Comments } from '@/components/Comments';

// Mock API
vi.mock('@/services/api', () => ({
    default: {
        get: vi.fn(() => Promise.resolve({ data: [] })),
        post: vi.fn(() => Promise.resolve({ data: {} })),
        put: vi.fn(() => Promise.resolve({ data: {} })),
        delete: vi.fn(() => Promise.resolve({ data: {} })),
    },
}));

// Mock auth context
vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: '1', name: 'Test User', email: 'test@test.com' },
    }),
}));

describe('Comments Component', () => {
    it('renders comments header', () => {
        render(<Comments entityType="task" entityId="123" />);
        expect(screen.getByText(/Comments/i)).toBeInTheDocument();
    });

    it('shows empty state when no comments', async () => {
        render(<Comments entityType="task" entityId="123" />);

        await waitFor(() => {
            expect(screen.getByText(/No comments yet/i)).toBeInTheDocument();
        });
    });

    it('allows user to type a comment', () => {
        render(<Comments entityType="task" entityId="123" />);

        const textarea = screen.getByPlaceholderText(/Add a comment/i);
        fireEvent.change(textarea, { target: { value: 'Test comment' } });

        expect(textarea).toHaveValue('Test comment');
    });

    it('disables send button when comment is empty', () => {
        render(<Comments entityType="task" entityId="123" />);

        const sendButton = screen.getByRole('button', { name: /Send/i });
        expect(sendButton).toBeDisabled();
    });
});
