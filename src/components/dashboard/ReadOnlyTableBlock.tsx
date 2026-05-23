'use client';

import React from 'react';

interface TableData {
    rows: string[][];
}

interface ReadOnlyTableBlockProps {
    content: string;
    align?: 'left' | 'center' | 'right';
}

export const ReadOnlyTableBlock: React.FC<ReadOnlyTableBlockProps> = ({ content, align = 'left' }) => {
    let data: TableData = { rows: [] };
    try {
        if (content && content.startsWith('{')) {
            const parsed = JSON.parse(content);
            if (parsed.rows) data = parsed;
        } else if (content && content.includes('|')) {
            // Parse markdown table format if any
            const lines = content.trim().split('\n');
            const rows = lines
                .filter(l => l.includes('|') && !l.includes('---'))
                .map(l => l.split('|').filter(c => c.trim() !== '' || l.startsWith('|')).map(c => c.trim()));
            if (rows.length > 0) data = { rows };
        }
    } catch (e) {
        console.error('Failed to parse table content in read-only view:', e);
    }

    if (!data.rows || data.rows.length === 0) {
        return (
            <div className="p-5 bg-zinc-50 border border-zinc-200 rounded-2xl font-mono text-[13px] my-4 w-full">
                <pre className="text-zinc-700 whitespace-pre-wrap">{content}</pre>
            </div>
        );
    }

    return (
        <div className={`my-6 overflow-x-auto w-full max-w-full rounded-xl border border-[#dee5d8] shadow-sm ${align === 'center' ? 'mx-auto' : align === 'right' ? 'ml-auto' : 'mr-auto'}`}>
            <table className="border-collapse w-full min-w-max border border-[#dee5d8]/80 text-[13px]">
                <tbody>
                    {data.rows.map((row, rIndex) => (
                        <tr 
                            key={`row-${rIndex}`} 
                            className={rIndex === 0 ? 'bg-[#f8faf7] font-bold border-b border-[#dee5d8]' : 'hover:bg-[#fcfdfa] border-b border-[#dee5d8]/50 last:border-b-0'}
                        >
                            {row.map((cell, cIndex) => (
                                <td 
                                    key={`cell-${rIndex}-${cIndex}`} 
                                    className="border-r border-[#dee5d8]/60 last:border-r-0 px-4 py-3 text-[#4a5147]"
                                    style={{ textAlign: align as any }}
                                    dangerouslySetInnerHTML={{ __html: cell }}
                                />
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
