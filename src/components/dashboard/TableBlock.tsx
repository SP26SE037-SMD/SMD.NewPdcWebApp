'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, MoreHorizontal, Layout, Columns, Rows } from 'lucide-react';

interface TableData {
    rows: string[][];
}

interface TableBlockProps {
    id: string;
    content: string;
    onChange: (val: string) => void;
    onFocus?: () => void;
    align?: 'left' | 'center' | 'right';
}

export const TableBlock: React.FC<TableBlockProps> = ({ id, content, onChange, onFocus, align = 'left' }) => {
    const [data, setData] = useState<TableData>({ rows: [['', ''], ['', '']] });
    const [activeCell, setActiveCell] = useState<{ r: number; c: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Parse initial content
    useEffect(() => {
        try {
            if (content && content.startsWith('{')) {
                const parsed = JSON.parse(content);
                if (parsed.rows) setData(parsed);
            } else if (content && content.includes('|')) {
                // Fallback: try to parse markdown table
                const lines = content.trim().split('\n');
                const rows = lines
                    .filter(l => l.includes('|') && !l.includes('---'))
                    .map(l => l.split('|').filter(c => c.trim() !== '' || l.startsWith('|')).map(c => c.trim()));
                if (rows.length > 0) setData({ rows });
            }
        } catch (e) {
            console.error('Failed to parse table content:', e);
        }
    }, [content]);

    const updateData = (newData: TableData) => {
        setData(newData);
        onChange(JSON.stringify(newData));
    };

    const handleCellChange = (r: number, c: number, value: string) => {
        const newRows = [...data.rows];
        newRows[r] = [...newRows[r]];
        newRows[r][c] = value;
        updateData({ rows: newRows });
    };

    const addRow = (index: number) => {
        const newRows = [...data.rows];
        const newRow = new Array(data.rows[0]?.length || 1).fill('');
        newRows.splice(index + 1, 0, newRow);
        updateData({ rows: newRows });
    };

    const removeRow = (index: number) => {
        if (data.rows.length <= 1) return;
        const newRows = [...data.rows];
        newRows.splice(index, 1);
        updateData({ rows: newRows });
    };

    const addColumn = (index: number) => {
        const newRows = data.rows.map(row => {
            const newRow = [...row];
            newRow.splice(index + 1, 0, '');
            return newRow;
        });
        updateData({ rows: newRows });
    };

    const removeColumn = (index: number) => {
        if (data.rows[0].length <= 1) return;
        const newRows = data.rows.map(row => {
            const newRow = [...row];
            newRow.splice(index, 1);
            return newRow;
        });
        updateData({ rows: newRows });
    };

    return (
        <div 
            className="my-10 relative group/table w-full transition-all"
            onFocus={onFocus}
            ref={containerRef}
        >
            <div className={`relative overflow-visible flex flex-col w-full ${align === 'center' ? 'items-center' : align === 'right' ? 'items-end' : 'items-start'}`}>
                
                {/* Main Table + Vertical Add Button Wrapper */}
                <div className="flex items-stretch overflow-visible group/controls max-w-full">
                    
                    {/* 1. Scrollable Table Area */}
                    <div className="overflow-x-auto custom-scrollbar flex-1 pb-14 min-w-0 pl-10 pr-2 pt-8">
                        <div className="relative inline-block min-w-full">
                            <table 
                                className="border-collapse border border-[#9ca3af] min-w-max w-full transition-all"
                            >
                                <tbody>
                                    {data.rows.map((row, rIndex) => (
                                        <tr 
                                            key={`row-${rIndex}`} 
                                            className={`group/row transition-colors ${rIndex === 0 ? 'bg-[#f8faf7]' : 'hover:bg-[#fcfdfa]'}`}
                                        >
                                            {row.map((cell, cIndex) => (
                                                <td key={`cell-${rIndex}-${cIndex}`} 
                                                    className={`relative border border-[#9ca3af] p-0 min-w-[120px] ${rIndex === 0 ? 'group/col font-bold' : ''}`}
                                                    style={{ textAlign: align as any }}
                                                >
                                                    {/* Column management tools */}
                                                    {rIndex === 0 && (
                                                        <div className="absolute inset-x-0 -top-8 opacity-0 group-hover/col:opacity-100 transition-all flex justify-center items-center z-40 pointer-events-none scale-90 group-hover/col:scale-100">
                                                            <div className="flex gap-1 bg-white border border-[#9ca3af] rounded-md shadow-lg p-1 pointer-events-auto">
                                                                <button onClick={() => addColumn(cIndex)} className="p-1 text-[#5a6157] hover:text-primary-600 hover:bg-primary-50 rounded transition-all">
                                                                    <Plus size={11} />
                                                                </button>
                                                                <button onClick={() => removeColumn(cIndex)} className="p-1 text-[#5a6157] hover:text-red-500 hover:bg-red-50 rounded transition-all">
                                                                    <Trash2 size={11} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Row management tools */}
                                                    {cIndex === 0 && (
                                                        <div className="absolute -left-9 top-1/2 -translate-y-1/2 opacity-0 group-hover/row:opacity-100 transition-all flex flex-col gap-1 z-40 scale-90 group-hover/row:scale-100 bg-white border border-[#9ca3af] shadow-md rounded-md p-1">
                                                            <button onClick={() => addRow(rIndex)} className="p-1 text-[#5a6157] hover:text-primary-600 hover:bg-primary-50 rounded transition-all">
                                                                <Plus size={11} />
                                                            </button>
                                                            <button onClick={() => removeRow(rIndex)} className="p-1 text-[#5a6157] hover:text-red-500 hover:bg-red-50 rounded transition-all">
                                                                <Trash2 size={11} />
                                                            </button>
                                                        </div>
                                                    )}
            
                                                    <div 
                                                        contentEditable
                                                        suppressContentEditableWarning
                                                        className={`px-4 py-3 outline-none min-h-[44px] text-[13px] leading-relaxed transition-colors tracking-tight
                                                            ${rIndex === 0 ? 'text-[#1a1f18]' : 'text-[#4a5147]'}
                                                            focus:bg-primary-500/10`}
                                                        onBlur={(e) => handleCellChange(rIndex, cIndex, e.currentTarget.innerHTML)}
                                                        onFocus={() => setActiveCell({ r: rIndex, c: cIndex })}
                                                        dangerouslySetInnerHTML={{ __html: cell }}
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Horizontal Insert Button */}
                            <button 
                                onClick={() => addRow(data.rows.length - 1)}
                                className="absolute top-full left-0 w-full mt-2 py-2.5 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#adb4a8] hover:text-primary-600 hover:bg-primary-50 hover:border-primary-200 transition-all border border-dashed border-[#9ca3af]/60 rounded-lg group-hover/controls:border-primary-300"
                            >
                                <Plus size={12} />
                                Insert New Row
                            </button>
                        </div>
                    </div>

                    {/* Vertical Insert Button */}
                    <button 
                        onClick={() => addColumn(data.rows[0].length - 1)}
                        className="flex-shrink-0 w-14 ml-3 mb-14 mt-8 flex flex-col items-center justify-center bg-[#fcfdfa] border border-dashed border-[#9ca3af]/60 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-all group-hover/controls:border-primary-300 rounded-lg z-20 self-stretch"
                    >
                        <Plus size={14} className="mb-3 text-[#adb4a8] group-hover:text-primary-600" />
                        <div className="flex flex-col items-center gap-2 text-[9px] font-black uppercase tracking-tight text-[#adb4a8] group-hover:text-primary-600 text-center leading-tight">
                            <span>INSERT</span>
                            <span>NEW</span>
                            <span>COLUMN</span>
                        </div>
                    </button>
                    
                </div>
            </div>
        </div>
    );
};
