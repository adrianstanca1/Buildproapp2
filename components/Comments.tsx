import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Trash2, Edit3, X, AtSign } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface Comment {
    id: string;
    user_name: string;
    content: string;
    created_at: string;
    updated_at?: string;
    mentions?: string[];
    attachments?: string[];
    parent_id?: string;
}

interface CommentsProps {
    entityType: 'task' | 'rfi' | 'daily_log' | 'document' | 'project';
    entityId: string;
    onCommentAdded?: () => void;
}

export const Comments: React.FC<CommentsProps> = ({ entityType, entityId, onCommentAdded }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [showMentions, setShowMentions] = useState(false);

    useEffect(() => {
        loadComments();
    }, [entityType, entityId]);

    const loadComments = async () => {
        try {
            const response = await api.get('/comments', {
                params: { entityType, entityId }
            });
            setComments(response.data || []);
        } catch (error) {
            console.error('Failed to load comments:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setLoading(true);
        try {
            // Extract @mentions from content
            const mentions = extractMentions(newComment);

            await api.post('/comments', {
                entityType,
                entityId,
                content: newComment,
                mentions,
            });

            setNewComment('');
            await loadComments();
            onCommentAdded?.();
        } catch (error) {
            console.error('Failed to add comment:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async (commentId: string) => {
        if (!editContent.trim()) return;

        try {
            await api.put(`/comments/${commentId}`, {
                content: editContent,
            });

            setEditingId(null);
            setEditContent('');
            await loadComments();
        } catch (error) {
            console.error('Failed to update comment:', error);
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!confirm('Delete this comment?')) return;

        try {
            await api.delete(`/comments/${commentId}`);
            await loadComments();
        } catch (error) {
            console.error('Failed to delete comment:', error);
        }
    };

    const extractMentions = (text: string): string[] => {
        const mentionRegex = /@(\w+)/g;
        const matches = text.match(mentionRegex);
        return matches ? matches.map(m => m.substring(1)) : [];
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-zinc-200">
            {/* Header */}
            <div className="px-4 py-3 border-b border-zinc-200 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-zinc-600" />
                <h3 className="font-semibold text-zinc-900">
                    Comments ({comments.length})
                </h3>
            </div>

            {/* Comments List */}
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                {comments.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500">
                        <MessageCircle className="w-12 h-12 mx-auto mb-2 text-zinc-300" />
                        <p className="text-sm">No comments yet. Start the conversation!</p>
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                            {/* Avatar */}
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                {comment.user_name?.[0]?.toUpperCase() || 'U'}
                            </div>

                            {/* Comment Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <span className="font-semibold text-sm text-zinc-900">
                                            {comment.user_name}
                                        </span>
                                        <span className="text-xs text-zinc-500 ml-2">
                                            {formatDate(comment.created_at)}
                                        </span>
                                    </div>

                                    {/* Actions (only for own comments) */}
                                    {user?.name === comment.user_name && (
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => {
                                                    setEditingId(comment.id);
                                                    setEditContent(comment.content);
                                                }}
                                                className="p-1 hover:bg-zinc-100 rounded text-zinc-600"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(comment.id)}
                                                className="p-1 hover:bg-red-50 rounded text-red-600"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Edit Mode */}
                                {editingId === comment.id ? (
                                    <div className="mt-2">
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            rows={2}
                                        />
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={() => handleEdit(comment.id)}
                                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingId(null);
                                                    setEditContent('');
                                                }}
                                                className="px-3 py-1 bg-zinc-200 text-zinc-700 rounded text-sm hover:bg-zinc-300"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-zinc-700 mt-1 whitespace-pre-wrap break-words">
                                        {comment.content}
                                    </p>
                                )}

                                {comment.updated_at && comment.updated_at !== comment.created_at && (
                                    <span className="text-xs text-zinc-400 italic">
                                        (edited)
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* New Comment Form */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-200">
                <div className="relative">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment... Use @name to mention someone"
                        className="w-full px-3 py-2 pr-24 border border-zinc-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        disabled={loading}
                    />
                    <div className="absolute bottom-2 right-2 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowMentions(!showMentions)}
                            className="p-1.5 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Add mention"
                        >
                            <AtSign className="w-4 h-4" />
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !newComment.trim()}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition"
                        >
                            <Send className="w-3.5 h-3.5" />
                            Send
                        </button>
                    </div>
                </div>
                {showMentions && (
                    <div className="mt-2 text-xs text-zinc-500 bg-blue-50 p-2 rounded">
                        💡 Tip: Type @ followed by a username to notify team members
                    </div>
                )}
            </form>
        </div>
    );
};
