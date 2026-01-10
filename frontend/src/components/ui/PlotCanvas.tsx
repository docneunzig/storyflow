import { useCallback, useMemo } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  BackgroundVariant,
  NodeProps,
  Handle,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'
import type { PlotBeat, PlotFramework } from '@/types/project'
import { Target, Users, MapPin, BookOpen } from 'lucide-react'

interface PlotCanvasProps {
  beats: PlotBeat[]
  framework: PlotFramework
  onNodeClick?: (beat: PlotBeat) => void
  getCharacterName?: (id: string) => string
}

// Status colors for beat nodes
const STATUS_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  outline: { border: 'border-text-secondary', bg: 'bg-text-secondary/20', text: 'text-text-secondary' },
  drafted: { border: 'border-accent', bg: 'bg-accent/20', text: 'text-accent' },
  revised: { border: 'border-success', bg: 'bg-success/20', text: 'text-success' },
  locked: { border: 'border-warning', bg: 'bg-warning/20', text: 'text-warning' },
}

// Framework position colors for visual distinction
const POSITION_COLORS: Record<string, string> = {
  'Act 1': '#3B82F6', // blue
  'Act 2': '#22C55E', // green
  'Act 3': '#EF4444', // red
  'Opening': '#8B5CF6', // purple
  'Rising': '#3B82F6', // blue
  'Middle': '#22C55E', // green
  'Crisis': '#F97316', // orange
  'Resolution': '#EF4444', // red
  'Present': '#3B82F6', // blue
  'Past': '#A855F7', // purple
  'Convergence': '#EC4899', // pink
  // Hero's Journey stages
  'Ordinary World': '#6B7280',
  'Call to Adventure': '#3B82F6',
  'Refusal of Call': '#F59E0B',
  'Meeting the Mentor': '#8B5CF6',
  'Crossing Threshold': '#22C55E',
  'Tests & Allies': '#3B82F6',
  'Approach': '#F97316',
  'Ordeal': '#EF4444',
  'Reward': '#22C55E',
  'Road Back': '#F97316',
  'Resurrection': '#EC4899',
  'Return': '#10B981',
  // Default
  'default': '#6B7280',
}

// Custom node component for plot beats
const PlotBeatNode = ({ data }: NodeProps<{
  beat: PlotBeat
  getCharacterName: (id: string) => string
  frameworkColor: string
}>) => {
  const statusStyle = STATUS_COLORS[data.beat.status] || STATUS_COLORS.outline

  return (
    <div
      className={`
        relative px-4 py-3 rounded-lg border-2 cursor-pointer
        min-w-[180px] max-w-[220px]
        transition-all duration-200 hover:shadow-lg hover:scale-105
        ${statusStyle.border} ${statusStyle.bg}
      `}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-accent !w-2 !h-2"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-accent !w-2 !h-2"
      />

      {/* Framework position badge */}
      {data.beat.frameworkPosition && (
        <div
          className="absolute -top-3 left-3 px-2 py-0.5 text-xs font-medium rounded text-white"
          style={{ backgroundColor: data.frameworkColor }}
        >
          {data.beat.frameworkPosition}
        </div>
      )}

      <div className="flex items-start gap-2 mt-1">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
          style={{ backgroundColor: data.frameworkColor }}
        >
          {data.beat.timelinePosition}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-text-primary text-sm truncate" title={data.beat.title}>
            {data.beat.title}
          </p>
          <p className={`text-xs capitalize ${statusStyle.text}`}>
            {data.beat.status}
          </p>
        </div>
      </div>

      {/* Summary */}
      {data.beat.summary && (
        <p className="text-xs text-text-secondary mt-2 line-clamp-2" title={data.beat.summary}>
          {data.beat.summary}
        </p>
      )}

      {/* Metadata icons */}
      <div className="flex items-center gap-2 mt-2 text-xs text-text-secondary">
        {data.beat.charactersInvolved && data.beat.charactersInvolved.length > 0 && (
          <span className="flex items-center gap-0.5" title={`Characters: ${data.beat.charactersInvolved.map(id => data.getCharacterName(id)).join(', ')}`}>
            <Users className="h-3 w-3" />
            {data.beat.charactersInvolved.length}
          </span>
        )}
        {data.beat.location && (
          <span className="flex items-center gap-0.5" title={`Location: ${data.beat.location}`}>
            <MapPin className="h-3 w-3" />
          </span>
        )}
        {data.beat.chapterTarget && (
          <span className="flex items-center gap-0.5" title={`Target: Chapter ${data.beat.chapterTarget}`}>
            <BookOpen className="h-3 w-3" />
            Ch.{data.beat.chapterTarget}
          </span>
        )}
        <span className="ml-auto" title="Estimated word count">
          ~{(data.beat.wordCountEstimate || 0).toLocaleString()}
        </span>
      </div>
    </div>
  )
}

// Define node types
const nodeTypes = {
  plotBeat: PlotBeatNode,
}

// Get color for a framework position
function getPositionColor(position: string): string {
  // Check for exact match first
  if (POSITION_COLORS[position]) {
    return POSITION_COLORS[position]
  }
  // Check for partial match (e.g., "Act 1: Setup" contains "Act 1")
  for (const key of Object.keys(POSITION_COLORS)) {
    if (position.includes(key)) {
      return POSITION_COLORS[key]
    }
  }
  return POSITION_COLORS.default
}

// Calculate positions for nodes based on framework
function calculateFrameworkLayout(
  beats: PlotBeat[],
  _framework: PlotFramework
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = []
  const count = beats.length

  if (count === 0) return positions

  // Layout parameters
  const startX = 50
  const startY = 200
  const horizontalSpacing = 280
  const verticalVariation = 60

  // Sort beats by timeline position
  const sortedBeats = [...beats].sort((a, b) => a.timelinePosition - b.timelinePosition)

  // Position beats in a horizontal timeline with slight vertical variation
  sortedBeats.forEach((_beat, index) => {
    // Create slight wave pattern for visual interest
    const verticalOffset = Math.sin(index * 0.5) * verticalVariation

    positions.push({
      x: startX + index * horizontalSpacing,
      y: startY + verticalOffset,
    })
  })

  return positions
}

export function PlotCanvas({ beats, framework, onNodeClick, getCharacterName = () => 'Unknown' }: PlotCanvasProps) {
  // Sort beats by timeline position
  const sortedBeats = useMemo(() => {
    return [...beats].sort((a, b) => a.timelinePosition - b.timelinePosition)
  }, [beats])

  // Generate nodes from beats
  const initialNodes = useMemo(() => {
    const positions = calculateFrameworkLayout(sortedBeats, framework)

    return sortedBeats.map((beat, index): Node => ({
      id: beat.id,
      type: 'plotBeat',
      position: positions[index] || { x: index * 280, y: 200 },
      data: {
        beat,
        getCharacterName,
        frameworkColor: getPositionColor(beat.frameworkPosition || ''),
      },
      draggable: true,
    }))
  }, [sortedBeats, framework, getCharacterName])

  // Generate edges connecting sequential beats and foreshadowing/payoff connections
  const initialEdges = useMemo(() => {
    const edges: Edge[] = []
    const addedEdges = new Set<string>()

    // Sequential timeline edges
    for (let i = 0; i < sortedBeats.length - 1; i++) {
      const currentBeat = sortedBeats[i]
      const nextBeat = sortedBeats[i + 1]
      const edgeId = `timeline-${currentBeat.id}-${nextBeat.id}`

      edges.push({
        id: edgeId,
        source: currentBeat.id,
        target: nextBeat.id,
        type: 'smoothstep',
        animated: false,
        style: {
          stroke: '#666',
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#666',
        },
      })
      addedEdges.add(edgeId)
    }

    // Foreshadowing edges (dashed, colored blue)
    for (const beat of sortedBeats) {
      if (beat.foreshadowing && beat.foreshadowing.length > 0) {
        for (const targetId of beat.foreshadowing) {
          const edgeId = `foreshadow-${beat.id}-${targetId}`
          if (!addedEdges.has(edgeId)) {
            edges.push({
              id: edgeId,
              source: beat.id,
              target: targetId,
              type: 'smoothstep',
              animated: true,
              style: {
                stroke: '#3B82F6', // blue
                strokeWidth: 2,
                strokeDasharray: '5,5',
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#3B82F6',
              },
              label: 'foreshadows',
              labelStyle: { fontSize: 10, fill: '#3B82F6' },
              labelBgStyle: { fill: '#1F2937', fillOpacity: 0.9 },
              labelBgPadding: [4, 2] as [number, number],
            })
            addedEdges.add(edgeId)
          }
        }
      }

      // Payoff edges (dashed, colored green) - reverse direction
      if (beat.payoffs && beat.payoffs.length > 0) {
        for (const sourceId of beat.payoffs) {
          const edgeId = `payoff-${sourceId}-${beat.id}`
          if (!addedEdges.has(edgeId)) {
            edges.push({
              id: edgeId,
              source: sourceId,
              target: beat.id,
              type: 'smoothstep',
              animated: true,
              style: {
                stroke: '#22C55E', // green
                strokeWidth: 2,
                strokeDasharray: '5,5',
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#22C55E',
              },
              label: 'pays off',
              labelStyle: { fontSize: 10, fill: '#22C55E' },
              labelBgStyle: { fill: '#1F2937', fillOpacity: 0.9 },
              labelBgPadding: [4, 2] as [number, number],
            })
            addedEdges.add(edgeId)
          }
        }
      }
    }

    return edges
  }, [sortedBeats])

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  // Handle node click
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const beat = beats.find((b) => b.id === node.id)
      if (beat && onNodeClick) {
        onNodeClick(beat)
      }
    },
    [beats, onNodeClick]
  )

  // Custom minimap node color based on status
  const nodeColor = useCallback((node: Node) => {
    const statusColors: Record<string, string> = {
      outline: '#6B7280',
      drafted: '#3B82F6',
      revised: '#22C55E',
      locked: '#F59E0B',
    }
    return statusColors[node.data?.beat?.status] || '#6B7280'
  }, [])

  if (beats.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-text-secondary">
        <Target className="h-12 w-12 mb-4 opacity-50" />
        <p>No plot beats to display.</p>
        <p className="text-sm mt-1">Create some plot beats to see them on the canvas.</p>
      </div>
    )
  }

  return (
    <div className="h-[600px] w-full bg-background rounded-lg border border-border overflow-hidden relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.3,
          maxZoom: 1.2,
        }}
        minZoom={0.2}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        attributionPosition="bottom-right"
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#333"
        />
        <Controls
          showZoom
          showFitView
          showInteractive
          className="!bg-surface-elevated !border-border !shadow-lg"
        />
        <MiniMap
          nodeColor={nodeColor}
          maskColor="rgba(0, 0, 0, 0.8)"
          className="!bg-surface !border-border"
          zoomable
          pannable
        />
      </ReactFlow>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-surface-elevated p-3 rounded-lg border border-border shadow-lg">
        <p className="text-xs font-medium text-text-primary mb-2">Beat Status</p>
        <div className="grid grid-cols-2 gap-1">
          {Object.entries(STATUS_COLORS).map(([status, colors]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded ${colors.bg} ${colors.border} border`} />
              <span className="text-xs text-text-secondary capitalize">{status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Framework info */}
      <div className="absolute top-4 left-4 bg-surface-elevated px-3 py-2 rounded-lg border border-border shadow-lg">
        <p className="text-xs font-medium text-text-primary">
          Framework: <span className="text-accent">{framework}</span>
        </p>
        <p className="text-xs text-text-secondary mt-0.5">
          {beats.length} beat{beats.length !== 1 ? 's' : ''} |
          {' '}{beats.reduce((acc, b) => acc + (b.wordCountEstimate || 0), 0).toLocaleString()} est. words
        </p>
      </div>
    </div>
  )
}
