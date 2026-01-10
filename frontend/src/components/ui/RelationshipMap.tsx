import { useCallback, useMemo, useState } from 'react'
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
import type { Character, CharacterRelationship } from '@/types/project'
import { User } from 'lucide-react'

interface RelationshipMapProps {
  characters: Character[]
  relationships: CharacterRelationship[]
  onNodeClick?: (character: Character) => void
}

// Custom node component for characters
const CharacterNode = ({ data }: NodeProps<{ character: Character; role: string }>) => {
  const roleColors: Record<string, string> = {
    protagonist: 'border-accent bg-accent/20',
    antagonist: 'border-error bg-error/20',
    supporting: 'border-success bg-success/20',
    minor: 'border-text-secondary bg-surface-elevated',
  }

  const statusColors: Record<string, string> = {
    alive: 'bg-success',
    deceased: 'bg-error',
    unknown: 'bg-warning',
  }

  // Size based on character importance/role
  const roleSizes: Record<string, string> = {
    protagonist: 'min-w-[160px] max-w-[200px] py-4',
    antagonist: 'min-w-[150px] max-w-[190px] py-4',
    supporting: 'min-w-[130px] max-w-[170px] py-3',
    minor: 'min-w-[100px] max-w-[140px] py-2',
  }

  return (
    <div
      className={`
        relative px-4 rounded-lg border-2 cursor-pointer
        transition-all duration-200 hover:shadow-lg hover:scale-105
        ${roleColors[data.character.role] || roleColors.minor}
        ${roleSizes[data.character.role] || roleSizes.minor}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-accent !w-2 !h-2"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-accent !w-2 !h-2"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="!bg-accent !w-2 !h-2"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="!bg-accent !w-2 !h-2"
      />

      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-text-secondary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-text-primary text-sm truncate" title={data.character.name}>
            {data.character.name}
          </p>
          <p className="text-xs text-text-secondary capitalize">{data.character.role}</p>
        </div>
      </div>

      {/* Status indicator */}
      <div
        className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${statusColors[data.character.status] || statusColors.unknown}`}
        title={data.character.status}
      />
    </div>
  )
}

// Define node types
const nodeTypes = {
  character: CharacterNode,
}

// Relationship type colors for edges
const EDGE_COLORS: Record<string, string> = {
  family: '#8B5CF6', // purple
  romantic: '#EC4899', // pink
  conflict: '#EF4444', // red
  alliance: '#22C55E', // green
  mentor: '#3B82F6', // blue
  sibling: '#A855F7', // purple-light
  rival: '#F97316', // orange
  friend: '#3B82F6', // blue
}

// Calculate positions for nodes in a circle layout
function calculateCircleLayout(count: number, centerX: number, centerY: number, radius: number): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = []
  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2
    positions.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    })
  }
  return positions
}

// Calculate positions using force-directed-like grid layout for many nodes
function calculateGridLayout(count: number): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = []
  const cols = Math.ceil(Math.sqrt(count))
  const spacing = 200

  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols)
    const col = i % cols
    // Add some randomness to avoid perfect grid
    const offsetX = (Math.random() - 0.5) * 40
    const offsetY = (Math.random() - 0.5) * 40
    positions.push({
      x: col * spacing + offsetX,
      y: row * spacing + offsetY,
    })
  }
  return positions
}

export function RelationshipMap({ characters, relationships, onNodeClick }: RelationshipMapProps) {
  // Generate nodes from characters
  const initialNodes = useMemo(() => {
    // Choose layout based on character count
    const positions = characters.length <= 20
      ? calculateCircleLayout(characters.length, 400, 300, Math.min(300, 50 * characters.length / Math.PI))
      : calculateGridLayout(characters.length)

    return characters.map((character, index): Node => ({
      id: character.id,
      type: 'character',
      position: positions[index] || { x: 0, y: 0 },
      data: { character, role: character.role },
      draggable: true,
    }))
  }, [characters])

  // Generate edges from relationships
  const initialEdges = useMemo(() => {
    // Create a map of character IDs to names for tooltips
    const charNameMap = new Map(characters.map(c => [c.id, c.name]))

    return relationships.map((rel, index): Edge => {
      const sourceName = charNameMap.get(rel.sourceCharacterId) || 'Unknown'
      const targetName = charNameMap.get(rel.targetCharacterId) || 'Unknown'
      const tooltipText = `${sourceName} → ${targetName}: ${rel.relationshipType}${rel.dynamicDescription ? `\n${rel.dynamicDescription}` : ''}`

      return {
        id: `${rel.sourceCharacterId}-${rel.targetCharacterId}-${index}`,
        source: rel.sourceCharacterId,
        target: rel.targetCharacterId,
        type: 'smoothstep',
        animated: rel.relationshipType === 'conflict' || rel.relationshipType === 'rival',
        style: {
          stroke: EDGE_COLORS[rel.relationshipType] || '#666',
          strokeWidth: 2,
        },
        label: rel.relationshipType,
        labelStyle: {
          fill: EDGE_COLORS[rel.relationshipType] || '#666',
          fontWeight: 500,
          fontSize: 11,
        },
        labelBgStyle: {
          fill: '#1A1A1A',
          fillOpacity: 0.8,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: EDGE_COLORS[rel.relationshipType] || '#666',
        },
        // Store tooltip data for hover
        data: {
          tooltip: tooltipText,
          description: rel.dynamicDescription,
          evolution: rel.evolution,
        },
      }
    })
  }, [relationships, characters])

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  // Edge hover state for tooltip
  const [hoveredEdge, setHoveredEdge] = useState<{ edge: Edge; x: number; y: number } | null>(null)

  // Handle edge hover
  const handleEdgeMouseEnter = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      setHoveredEdge({ edge, x: event.clientX, y: event.clientY })
    },
    []
  )

  const handleEdgeMouseLeave = useCallback(() => {
    setHoveredEdge(null)
  }, [])

  // Handle node click
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const character = characters.find((c) => c.id === node.id)
      if (character && onNodeClick) {
        onNodeClick(character)
      }
    },
    [characters, onNodeClick]
  )

  // Custom minimap node color
  const nodeColor = useCallback((node: Node) => {
    const roleColors: Record<string, string> = {
      protagonist: '#3B82F6',
      antagonist: '#EF4444',
      supporting: '#22C55E',
      minor: '#6B7280',
    }
    return roleColors[node.data?.role] || '#6B7280'
  }, [])

  if (characters.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-text-secondary">
        <p>No characters to display. Create some characters first.</p>
      </div>
    )
  }

  return (
    <div className="h-[600px] w-full bg-background rounded-lg border border-border overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onEdgeMouseEnter={handleEdgeMouseEnter}
        onEdgeMouseLeave={handleEdgeMouseLeave}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
          maxZoom: 1.5,
        }}
        minZoom={0.1}
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

      {/* Edge tooltip on hover */}
      {hoveredEdge && hoveredEdge.edge.data && (
        <div
          className="fixed z-50 bg-surface-elevated px-3 py-2 rounded-lg border border-border shadow-lg max-w-xs pointer-events-none"
          style={{
            left: hoveredEdge.x + 10,
            top: hoveredEdge.y + 10,
          }}
        >
          <p className="text-sm font-medium text-text-primary whitespace-pre-line">
            {hoveredEdge.edge.data.tooltip}
          </p>
          {hoveredEdge.edge.data.evolution && (
            <p className="text-xs text-text-secondary mt-1">
              <span className="font-medium">Evolution:</span> {hoveredEdge.edge.data.evolution}
            </p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-surface-elevated p-3 rounded-lg border border-border shadow-lg">
        <p className="text-xs font-medium text-text-primary mb-2">Relationship Types</p>
        <div className="grid grid-cols-2 gap-1">
          {Object.entries(EDGE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded" style={{ backgroundColor: color }} />
              <span className="text-xs text-text-secondary capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
