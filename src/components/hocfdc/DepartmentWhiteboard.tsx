"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Network, Search, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
    ReactFlow, 
    MiniMap, 
    Controls, 
    Background, 
    useNodesState, 
    useEdgesState, 
    Position, 
    Handle, 
    BackgroundVariant,
    NodeProps,
    Edge,
    Node as FlowNode,
    MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';

const nodeWidth = 280;
const nodeHeight = 160;

// Custom Node to emulate our beautiful Tailwind Card
const SubjectNodeComponent = ({ data }: NodeProps) => {
    const { code, name, isMatched, isDimmed, dependentsCount, onClick } = data as any;
    
    return (
        <div 
            onClick={() => onClick && onClick(code)}
            className={cn(
                "w-[280px] p-6 rounded-[2rem] border transition-all duration-300 shadow-sm bg-white cursor-pointer group/card",
                isMatched ? "border-primary/50 bg-primary/5 ring-4 ring-primary/10 shadow-xl" : "border-zinc-100 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1",
                isDimmed && "opacity-40 grayscale hover:grayscale-0 hover:opacity-100"
            )}
        >
            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-zinc-300 rounded-full border-2 border-white -ml-1" />
            
            <div className="flex items-start justify-between mb-4 pointer-events-none">
                <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center text-[11px] font-black transition-all shadow-inner",
                    isMatched 
                        ? "bg-primary text-white" 
                        : "bg-zinc-50 text-zinc-500 group-hover/card:bg-primary/10 group-hover/card:text-primary"
                )}>
                    {code.substring(0, 3)}
                </div>
                <div className="flex flex-col items-end">
                    <span className={cn(
                        "text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full",
                        isMatched ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-zinc-50 text-zinc-400 group-hover/card:bg-zinc-900 group-hover/card:text-white transition-colors"
                    )}>
                        {code}
                    </span>
                </div>
            </div>
            
            <h4 className={cn(
                "text-sm font-black leading-tight line-clamp-2 h-10 tracking-tight pointer-events-none",
                isMatched ? "text-primary" : "text-zinc-900"
            )}>
                {name}
            </h4>
            
            {/* Dependents counter badge */}
            {dependentsCount > 0 && (
                <div className="mt-4 pt-4 border-t border-zinc-50 flex items-center justify-between opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Dependents</span>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-900 bg-zinc-100 px-2 py-1 rounded-md">
                        <Search size={10} className="text-zinc-500" />
                        {dependentsCount} Modules
                    </div>
                </div>
            )}
            
            <Handle type="source" position={Position.Right} className="w-3 h-3 bg-primary rounded-full border-2 border-white -mr-1" />
        </div>
    );
};

const nodeTypes = {
    subjectNode: SubjectNodeComponent
};

// Layout Engine
const getLayoutedElements = (nodes: FlowNode[], edges: Edge[], direction = 'LR') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    
    // Config dagre
    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ 
        rankdir: direction,
        ranksep: 200,   // horizontal space between node clusters
        nodesep: 50     // vertical space between nodes
    });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = isHorizontal ? Position.Left : Position.Top;
        node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

        // Shift position to match custom node center anchors
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };

        return node;
    });

    return { layoutedNodes: nodes, layoutedEdges: edges };
};


interface DepartmentWhiteboardProps {
    subjects: any[]; // Raw subjects from the backend
    searchQuery: string;
    onNodeClick: (subject: any) => void;
}

export const DepartmentWhiteboard: React.FC<DepartmentWhiteboardProps> = ({ subjects, searchQuery, onNodeClick }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    useEffect(() => {
        if (!subjects || subjects.length === 0) return;

        const initialNodes: FlowNode[] = [];
        const initialEdges: Edge[] = [];
        const connectedSubjectCodes = new Set<string>();
        const dependentsCountMap = new Map<string, number>();

        // Find connected subjects & build links
        subjects.forEach(subject => {
            if (subject.preRequisite && subject.preRequisite.length > 0) {
                const targetCode = subject.subjectCode;
                connectedSubjectCodes.add(targetCode);
                
                subject.preRequisite.forEach((prereq: any) => {
                    const sourceCode = prereq.prerequisiteSubjectCode;
                    connectedSubjectCodes.add(sourceCode);
                    
                    dependentsCountMap.set(sourceCode, (dependentsCountMap.get(sourceCode) || 0) + 1);

                    initialEdges.push({
                        id: `edge-${sourceCode}-${targetCode}`,
                        source: sourceCode,
                        target: targetCode,
                        type: 'smoothstep', // Use 'smoothstep' or 'bezier' or 'step'
                        animated: true,
                        style: { strokeWidth: 2, stroke: '#d4d4d8' },
                        markerEnd: { type: MarkerType.ArrowClosed, color: '#d4d4d8' },
                    });
                });
            }
        });

        if (connectedSubjectCodes.size === 0) {
            setNodes([]);
            setEdges([]);
            return;
        }

        // Create initial React Flow nodes
        Array.from(connectedSubjectCodes).forEach(code => {
            const subject = subjects.find(s => s.subjectCode === code) || { subjectName: code, subjectId: code };
            
            // Check search status
            const isMatched = searchQuery 
                ? (code.toLowerCase().includes(searchQuery.toLowerCase()) || subject.subjectName.toLowerCase().includes(searchQuery.toLowerCase()))
                : false;
            
            const isDimmed = searchQuery && !isMatched;

            initialNodes.push({
                id: code,
                type: 'subjectNode',
                position: { x: 0, y: 0 },
                data: {
                    code,
                    name: subject.subjectName,
                    isMatched,
                    isDimmed,
                    dependentsCount: dependentsCountMap.get(code) || 0,
                    onClick: (clickedCode: string) => {
                        const originalSub = subjects.find(s => s.subjectCode === clickedCode);
                        if (originalSub) {
                            onNodeClick({ id: originalSub.subjectId, code: originalSub.subjectCode, name: originalSub.subjectName });
                        }
                    }
                }
            });
        });

        // Run Dagre Layout
        const { layoutedNodes, layoutedEdges } = getLayoutedElements(initialNodes, initialEdges, 'LR');
        
        // Highlight active edges if needed based on search query
        const finalEdges = layoutedEdges.map(edge => {
            const isMatchedEdge = searchQuery && layoutedNodes.find(n => n.id === edge.source)?.data.isMatched && layoutedNodes.find(n => n.id === edge.target)?.data.isMatched;
            return {
                ...edge,
                style: { 
                    strokeWidth: isMatchedEdge ? 3 : 2, 
                    stroke: isMatchedEdge ? '#4caf50' : '#d4d4d8' 
                },
                animated: true,
                markerEnd: { type: MarkerType.ArrowClosed, color: isMatchedEdge ? '#4caf50' : '#d4d4d8' },
            };
        });

        setNodes(layoutedNodes);
        setEdges(finalEdges);

    }, [subjects, searchQuery]);

    if (!subjects || subjects.length === 0) return null;

    if (nodes.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-center py-20 bg-zinc-50/30">
                <div className="w-20 h-20 bg-zinc-50 rounded-[2.5rem] flex items-center justify-center text-zinc-300 mb-6 shadow-inner">
                    <Network size={40} />
                </div>
                <h3 className="text-xl font-black text-zinc-900 tracking-tight uppercase">Isolated Ecosystem</h3>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-2 max-w-sm leading-relaxed">
                    No dependency chains discovered within this department. Modules stand independently.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full h-[calc(100vh-80px)]" style={{ background: '#f8fafc' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.1}
                maxZoom={1.5}
                attributionPosition="bottom-right"
            >
                <Background variant={BackgroundVariant.Dots} gap={24} size={2} color="#e2e8f0" />
                <Controls 
                    className="bg-white border-zinc-100 shadow-xl rounded-2xl overflow-hidden" 
                    showInteractive={false}
                />
                <MiniMap 
                    className="bg-white border-zinc-100 shadow-xl rounded-3xl overflow-hidden pointer-events-none"
                    nodeColor={(n) => {
                        if (n.data.isMatched) return '#4caf50';
                        return '#f4f4f5';
                    }}
                    nodeBorderRadius={14}
                    maskColor="rgba(255, 255, 255, 0.6)"
                />
            </ReactFlow>
        </div>
    );
};
