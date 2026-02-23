'use client';

import { useEffect, useState } from 'react';

interface SavedResearch {
    id: string;
    createdAt: string;
    title: string;
    content: string;
    sources: Array<{ number: number; title: string; url: string; source: string }> | null;
    taskId: string | null;
}

export default function NotebookPage() {
    const [items, setItems] = useState<SavedResearch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchNotebookItems();
    }, []);

    const fetchNotebookItems = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/notebook');
            if (!res.ok) throw new Error('Failed to fetch notebook items');
            const data = await res.json();
            setItems(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this specific research from your notebook?')) return;

        try {
            const res = await fetch(`/api/notebook/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');

            // Optimitistic update
            setItems((prev) => prev.filter((item) => item.id !== id));
        } catch (err) {
            console.error(err);
            alert('Failed to delete research item. Please try again.');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 md:p-10">
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="flex flex-col md:flex-row items-baseline justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            My Notebook
                        </h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            Your saved agentic research responses and findings.
                        </p>
                    </div>
                    <a
                        href="/"
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-lg"
                    >
                        ← Back to Chat
                    </a>
                </header>

                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-800 rounded-lg">
                        {error}
                    </div>
                )}

                {items.length === 0 && !error ? (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <h3 className="text-xl font-medium text-gray-900 dark:text-white">Your notebook is empty</h3>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">
                            Start researching in chat and click "Save to Notebook" on any final response you want to keep.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className="group flex flex-col bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                            >
                                {/* Header */}
                                <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                                            {item.title}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(item.createdAt).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="text-gray-400 hover:text-red-600 transition-colors p-1 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        title="Delete item"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-5 flex-1 bg-gray-50/50 dark:bg-gray-800/50 max-h-80 overflow-y-auto">
                                    <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                        {item.content}
                                    </div>
                                </div>

                                {/* Sources */}
                                {item.sources && item.sources.length > 0 && (
                                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                            Sources
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {item.sources.map((source, idx) => (
                                                <a
                                                    key={idx}
                                                    href={source.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors max-w-full"
                                                    title={source.title}
                                                >
                                                    <span className="text-blue-600 dark:text-blue-400">[{source.number || idx + 1}]</span>
                                                    <span className="truncate">{source.title}</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
