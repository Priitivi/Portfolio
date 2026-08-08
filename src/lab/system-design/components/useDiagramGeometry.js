import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { connectionGeometry, localBounds } from "./diagramGeometry";

export function useDiagramGeometry(connections) {
  const containerRef = useRef(null);
  const nodesRef = useRef(new Map());
  const callbacksRef = useRef(new Map());
  const observerRef = useRef(null);
  const frameRef = useRef(null);
  const connectionsRef = useRef(connections);
  const [geometry, setGeometry] = useState({ width: 0, height: 0, connections: {} });
  connectionsRef.current = connections;

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const nodeBounds = {};
    nodesRef.current.forEach((element, id) => {
      if (element) nodeBounds[id] = localBounds(element.getBoundingClientRect(), containerRect);
    });
    const size = { width: container.clientWidth, height: container.clientHeight };
    const measuredConnections = {};
    connectionsRef.current.forEach((connection) => {
      const measured = connectionGeometry(connection, nodeBounds, size);
      if (measured) measuredConnections[connection.id] = measured;
    });
    setGeometry({ ...size, connections: measuredConnections });
  }, []);

  const requestMeasure = useCallback(() => {
    if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = window.requestAnimationFrame(measure);
  }, [measure]);

  const registerNode = useCallback((id) => {
    if (!callbacksRef.current.has(id)) {
      callbacksRef.current.set(id, (element) => {
        const previous = nodesRef.current.get(id);
        if (previous && observerRef.current) observerRef.current.unobserve(previous);
        if (element) {
          nodesRef.current.set(id, element);
          observerRef.current?.observe(element);
        } else {
          nodesRef.current.delete(id);
        }
        requestMeasure();
      });
    }
    return callbacksRef.current.get(id);
  }, [requestMeasure]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const observer = new ResizeObserver(requestMeasure);
    observerRef.current = observer;
    observer.observe(container);
    nodesRef.current.forEach((node) => observer.observe(node));
    document.fonts?.ready.then(requestMeasure);
    requestMeasure();
    return () => {
      observer.disconnect();
      observerRef.current = null;
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, [requestMeasure]);

  useLayoutEffect(() => { requestMeasure(); }, [connections, requestMeasure]);

  return { containerRef, registerNode, geometry };
}
