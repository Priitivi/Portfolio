import { useId } from "react";
import { useDiagramGeometry } from "./useDiagramGeometry";

export default function SystemDiagram({ className = "", connections, activeConnections = [], packets = [], children }) {
  const markerId = useId().replaceAll(":", "");
  const { containerRef, registerNode, geometry } = useDiagramGeometry(connections);
  const activeSet = new Set(activeConnections);

  return (
    <div ref={containerRef} className={`sd-diagram ${className}`}>
      {geometry.width > 0 && (
        <svg className="sd-diagram-svg" viewBox={`0 0 ${geometry.width} ${geometry.height}`} aria-hidden="true">
          <defs>
            <marker id={`${markerId}-arrow`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L8 4 L0 8 Z" fill="context-stroke" />
            </marker>
          </defs>
          {connections.map((connection) => {
            const measured = geometry.connections[connection.id];
            if (!measured || connection.hidden) return null;
            const active = activeSet.has(connection.id);
            return (
              <g className={`sd-connection ${active ? "is-active" : ""} ${connection.muted ? "is-muted" : ""}`} key={connection.id} data-connection={connection.id}>
                <path className="sd-connection-hitbox" d={measured.d} />
                <path className="sd-connection-line" d={measured.d} markerEnd={`url(#${markerId}-arrow)`} />
                <circle className="sd-anchor-dot" cx={measured.start.x} cy={measured.start.y} r="2.6" />
                <circle className="sd-anchor-dot" cx={measured.end.x} cy={measured.end.y} r="2.6" />
              </g>
            );
          })}
          {packets.map((packet) => {
            const measured = geometry.connections[packet.connectionId];
            if (!measured) return null;
            const path = packet.reverse ? measured.reverseD : measured.d;
            return (
              <circle className={`sd-svg-packet ${packet.tone ? `is-${packet.tone}` : ""}`} data-packet-connection={packet.connectionId} cx="0" cy="0" r="5" key={packet.key}>
                <animateMotion path={path} begin={`${packet.delay || 0}ms`} dur={`${packet.duration || 420}ms`} calcMode="linear" fill="freeze" />
              </circle>
            );
          })}
        </svg>
      )}
      {children(registerNode)}
    </div>
  );
}
