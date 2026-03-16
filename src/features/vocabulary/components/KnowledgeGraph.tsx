import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Network, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import * as d3 from 'd3';
import { aiService } from '../../../services/aiService';

interface WordData {
  word: string;
  translation: string;
  tags: string[];
  mastery: number;
}

interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  relationship: string;
}

interface GraphCluster {
  name: string;
  words: string[];
  color: string;
}

interface GraphData {
  edges: GraphEdge[];
  clusters: GraphCluster[];
}

interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  translation: string;
  mastery: number;
  tags: string[];
  color: string;
  clusterName: string;
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  weight: number;
  relationship: string;
}

interface KnowledgeGraphProps {
  words: WordData[];
  onClose: () => void;
}

type Status = 'idle' | 'loading' | 'ready' | 'error';

export default function KnowledgeGraph({ words, onClose }: KnowledgeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [error, setError] = useState('');
  const [hoveredNode, setHoveredNode] = useState<D3Node | null>(null);
  const [activeCluster, setActiveCluster] = useState<string | null>(null);
  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null);

  const handleGenerate = useCallback(async () => {
    if (words.length === 0) return;
    setStatus('loading');
    setError('');
    try {
      const result = await aiService.generateKnowledgeGraph(words.slice(0, 50));
      setGraphData(result);
      setStatus('ready');
    } catch (err: any) {
      setError(err.message || 'Failed to generate knowledge graph.');
      setStatus('error');
    }
  }, [words]);

  useEffect(() => {
    handleGenerate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const wordMap = useMemo(() => {
    const map = new Map<string, WordData>();
    for (const w of words) map.set(w.word, w);
    return map;
  }, [words]);

  useEffect(() => {
    if (status !== 'ready' || !graphData || !svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = Math.max(400, container.clientHeight);

    // Build node list from cluster data
    const nodeSet = new Set<string>();
    const nodeColorMap = new Map<string, { color: string; clusterName: string }>();

    for (const cluster of graphData.clusters) {
      for (const word of cluster.words) {
        nodeSet.add(word);
        if (!nodeColorMap.has(word)) {
          nodeColorMap.set(word, { color: cluster.color, clusterName: cluster.name });
        }
      }
    }

    // Also add words from edges
    for (const edge of graphData.edges) {
      nodeSet.add(edge.source);
      nodeSet.add(edge.target);
    }

    const nodes: D3Node[] = Array.from(nodeSet).map(id => {
      const wData = wordMap.get(id);
      const cData = nodeColorMap.get(id) || { color: '#94a3b8', clusterName: 'Other' };
      return {
        id,
        translation: wData?.translation || '',
        mastery: wData?.mastery || 0,
        tags: wData?.tags || [],
        color: cData.color,
        clusterName: cData.clusterName,
      };
    });

    const nodeIds = new Set(nodes.map(n => n.id));
    const links: D3Link[] = graphData.edges
      .filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map(e => ({
        source: e.source,
        target: e.target,
        weight: e.weight,
        relationship: e.relationship,
      }));

    // Clear previous
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g');

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom);

    // Force simulation
    const simulation = d3.forceSimulation<D3Node>(nodes)
      .force('link', d3.forceLink<D3Node, D3Link>(links).id(d => d.id).distance(80).strength(d => d.weight * 0.5))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(d => getNodeRadius(d as D3Node) + 8));

    simulationRef.current = simulation;

    // Links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('class', 'kg-link')
      .attr('stroke', '#94a3b8')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', d => Math.max(1, d.weight * 3))
      .attr('stroke-dasharray', d => d.weight < 0.5 ? '4,4' : 'none');

    // Link labels (on hover via title)
    link.append('title').text(d => d.relationship);

    // Nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'kg-node')
      .call(d3.drag<SVGGElement, D3Node>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // Node circles
    node.append('circle')
      .attr('r', d => getNodeRadius(d))
      .attr('fill', d => d.color)
      .attr('fill-opacity', 0.8)
      .attr('stroke', d => getMasteryBorder(d.mastery))
      .attr('stroke-width', 2.5);

    // Labels for larger nodes
    node.append('text')
      .text(d => d.id)
      .attr('text-anchor', 'middle')
      .attr('dy', d => getNodeRadius(d) + 14)
      .attr('font-size', '10px')
      .attr('fill', 'var(--text-secondary, #64748b)')
      .attr('pointer-events', 'none');

    // Hover effects
    node
      .on('mouseenter', function(_event, d) {
        setHoveredNode(d);
        // Highlight connected edges
        link
          .attr('stroke-opacity', l => {
            const s = (l.source as D3Node).id;
            const t = (l.target as D3Node).id;
            return (s === d.id || t === d.id) ? 0.9 : 0.1;
          })
          .attr('stroke-width', l => {
            const s = (l.source as D3Node).id;
            const t = (l.target as D3Node).id;
            return (s === d.id || t === d.id) ? Math.max(2, l.weight * 4) : Math.max(1, l.weight * 2);
          });
        // Dim non-connected nodes
        const connectedIds = new Set<string>();
        connectedIds.add(d.id);
        links.forEach(l => {
          const s = (l.source as D3Node).id || (l.source as string);
          const t = (l.target as D3Node).id || (l.target as string);
          if (s === d.id) connectedIds.add(t);
          if (t === d.id) connectedIds.add(s);
        });
        node.select('circle').attr('fill-opacity', n => connectedIds.has(n.id) ? 0.9 : 0.2);
        node.select('text').attr('fill-opacity', n => connectedIds.has(n.id) ? 1 : 0.2);
      })
      .on('mouseleave', function() {
        setHoveredNode(null);
        link.attr('stroke-opacity', 0.4).attr('stroke-width', d => Math.max(1, d.weight * 3));
        node.select('circle').attr('fill-opacity', 0.8);
        node.select('text').attr('fill-opacity', 1);
      });

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as D3Node).x!)
        .attr('y1', d => (d.source as D3Node).y!)
        .attr('x2', d => (d.target as D3Node).x!)
        .attr('y2', d => (d.target as D3Node).y!);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [status, graphData, wordMap]);

  // Apply cluster filter
  useEffect(() => {
    if (!svgRef.current || !graphData) return;
    const svg = d3.select(svgRef.current);
    if (activeCluster) {
      const clusterWords = new Set(
        graphData.clusters.find(c => c.name === activeCluster)?.words || []
      );
      svg.selectAll<SVGGElement, D3Node>('.kg-node')
        .select('circle')
        .attr('fill-opacity', d => clusterWords.has(d.id) ? 0.9 : 0.15);
      svg.selectAll<SVGGElement, D3Node>('.kg-node')
        .select('text')
        .attr('fill-opacity', d => clusterWords.has(d.id) ? 1 : 0.15);
    } else {
      svg.selectAll('.kg-node circle').attr('fill-opacity', 0.8);
      svg.selectAll('.kg-node text').attr('fill-opacity', 1);
    }
  }, [activeCluster, graphData]);

  const edgeCount = graphData?.edges.length || 0;
  const clusterCount = graphData?.clusters.length || 0;
  const nodeCount = graphData ? new Set([
    ...graphData.clusters.flatMap(c => c.words),
    ...graphData.edges.map(e => e.source),
    ...graphData.edges.map(e => e.target),
  ]).size : 0;

  return (
    <motion.div
      className="knowledge-graph-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="knowledge-graph card"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <div className="knowledge-graph__header">
          <div className="knowledge-graph__title">
            <Network size={20} />
            <h3>Knowledge Graph</h3>
          </div>
          <div className="knowledge-graph__header-actions">
            {status === 'ready' && (
              <button className="btn btn-secondary btn-sm" onClick={handleGenerate}>
                <RefreshCw size={14} style={{ marginRight: 4 }} />
                Regenerate
              </button>
            )}
            <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
          </div>
        </div>

        {status === 'loading' && (
          <div className="knowledge-graph__loading">
            <Loader2 size={32} className="knowledge-graph__spinner" />
            <p>Analyzing semantic relationships...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="knowledge-graph__error">
            <AlertCircle size={24} />
            <p>{error}</p>
            <button className="btn btn-primary btn-sm" onClick={handleGenerate}>Retry</button>
          </div>
        )}

        {status === 'ready' && graphData && (
          <>
            {/* Cluster filter pills */}
            <div className="knowledge-graph__clusters">
              <button
                className={`knowledge-graph__cluster-pill ${!activeCluster ? 'knowledge-graph__cluster-pill--active' : ''}`}
                onClick={() => setActiveCluster(null)}
              >
                All
              </button>
              {graphData.clusters.map(cluster => (
                <button
                  key={cluster.name}
                  className={`knowledge-graph__cluster-pill ${activeCluster === cluster.name ? 'knowledge-graph__cluster-pill--active' : ''}`}
                  onClick={() => setActiveCluster(prev => prev === cluster.name ? null : cluster.name)}
                  style={{
                    borderColor: cluster.color,
                    ...(activeCluster === cluster.name ? { background: cluster.color, color: '#fff' } : {}),
                  }}
                >
                  {cluster.name}
                </button>
              ))}
            </div>

            {/* Graph container */}
            <div className="knowledge-graph__canvas" ref={containerRef}>
              <svg ref={svgRef} />
            </div>

            {/* Tooltip */}
            {hoveredNode && (
              <div className="knowledge-graph__tooltip">
                <strong>{hoveredNode.id}</strong>
                {hoveredNode.translation && <span> - {hoveredNode.translation}</span>}
                <div className="knowledge-graph__tooltip-meta">
                  <span>Mastery: {(hoveredNode.mastery * 100).toFixed(0)}%</span>
                  <span>Cluster: {hoveredNode.clusterName}</span>
                </div>
                {hoveredNode.tags.length > 0 && (
                  <div className="knowledge-graph__tooltip-tags">
                    {hoveredNode.tags.map(t => <span key={t}>{t}</span>)}
                  </div>
                )}
              </div>
            )}

            {/* Stats footer */}
            <div className="knowledge-graph__stats">
              <span>Nodes: {nodeCount}</span>
              <span>Edges: {edgeCount}</span>
              <span>Clusters: {clusterCount}</span>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

function getNodeRadius(d: D3Node): number {
  return 8 + d.mastery * 12;
}

function getMasteryBorder(mastery: number): string {
  if (mastery >= 0.8) return '#22c55e';
  if (mastery >= 0.4) return '#f59e0b';
  return '#94a3b8';
}
