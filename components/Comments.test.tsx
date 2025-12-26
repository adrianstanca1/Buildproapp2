import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Comments } from '@/components/Comments';

// Mock DB service
vi.mock('@/services/db', () => ({
    db: {
        getComments: vi.fn(() => Promise.resolve([])),
        addComment: vi.fn(() => Promise.resolve({ id: '123' })),
        updateComment: vi.fn(() => Promise.resolve()),
        deleteComment: vi.fn(() => Promise.resolve()),
    },
}));

// Mock auth context
vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: '1', name: 'Test User', email: 'test@test.com' },
    }),
}));

describe('Comments Component', () => {
    it('renders comments header', async () => {
        render(<Comments entityType="task" entityId="123" />);
        await waitFor(() => expect(screen.getByText(/No comments yet/i)).toBeInTheDocument());
        expect(screen.getByRole('heading', { name: /Comments/i })).toBeInTheDocument();
    });

    it('shows empty state when no comments', async () => {
        render(<Comments entityType="task" entityId="123" />);

        await waitFor(() => {
            expect(screen.getByText(/No comments yet/i)).toBeInTheDocument();
        });
    });

    it('allows user to type a comment', async () => {
        render(<Comments entityType="task" entityId="123" />);
        await waitFor(() => expect(screen.getByText(/No comments yet/i)).toBeInTheDocument());

        const textarea = screen.getByPlaceholderText(/Add a comment/i);
        fireEvent.change(textarea, { target: { value: 'Test comment' } });

        expect(textarea).toHaveValue('Test comment');
    });

    it('disables send button when comment is empty', async () => {
        render(<Comments entityType="task" entityId="123" />);
        await waitFor(() => expect(screen.getByText(/No comments yet/i)).toBeInTheDocument());

        const sendButton = screen.getByRole('button', { name: /Send/i });
        expect(sendButton).toBeDisabled();
    });
});
