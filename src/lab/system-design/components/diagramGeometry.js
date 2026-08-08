const anchorForDirection = (from, to) => {
  const dx = to.cx - from.cx;
  const dy = to.cy - from.cy;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? ["right", "left"] : ["left", "right"];
  return dy >= 0 ? ["bottom", "top"] : ["top", "bottom"];
};

export function anchorPoint(bounds, anchor) {
  if (anchor === "top") return { x: bounds.cx, y: bounds.top };
  if (anchor === "right") return { x: bounds.right, y: bounds.cy };
  if (anchor === "bottom") return { x: bounds.cx, y: bounds.bottom };
  return { x: bounds.left, y: bounds.cy };
}

export function pathData(points) {
  if (!points.length) return "";
  return points.reduce((path, point, index) => `${path}${index ? " L" : "M"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`, "");
}

export function connectionGeometry(connection, nodes, container) {
  const fromBounds = nodes[connection.from];
  const toBounds = nodes[connection.to];
  if (!fromBounds || !toBounds) return null;

  let fromAnchor = connection.fromAnchor;
  let toAnchor = connection.toAnchor;
  if (!fromAnchor || !toAnchor) [fromAnchor, toAnchor] = anchorForDirection(fromBounds, toBounds);

  const route = connection.route === "responsive-fanout"
    ? (container.width < 600 ? "side-right" : "fanout-down")
    : connection.route;

  if (route === "side-right") {
    fromAnchor = "right";
    toAnchor = "right";
  }

  const from = anchorPoint(fromBounds, fromAnchor);
  const to = anchorPoint(toBounds, toAnchor);
  let points = [from, to];

  if (route === "fanout-down") {
    const branchY = from.y + Math.max(20, Math.min(54, (to.y - from.y) * 0.38));
    points = [from, { x: from.x, y: branchY }, { x: to.x, y: branchY }, to];
  } else if (route === "fanout-right") {
    const branchX = from.x + Math.max(20, Math.min(64, (to.x - from.x) * 0.38));
    points = [from, { x: branchX, y: from.y }, { x: branchX, y: to.y }, to];
  } else if (route === "side-right") {
    const channelX = Math.max(from.x, to.x, container.width - 18);
    points = [from, { x: channelX, y: from.y }, { x: channelX, y: to.y }, to];
  } else if (route === "orthogonal") {
    const horizontal = Math.abs(to.x - from.x) >= Math.abs(to.y - from.y);
    if (horizontal) {
      const middleX = (from.x + to.x) / 2;
      points = [from, { x: middleX, y: from.y }, { x: middleX, y: to.y }, to];
    } else {
      const middleY = (from.y + to.y) / 2;
      points = [from, { x: from.x, y: middleY }, { x: to.x, y: middleY }, to];
    }
  }

  return {
    ...connection,
    fromAnchor,
    toAnchor,
    points,
    d: pathData(points),
    reverseD: pathData([...points].reverse()),
    start: from,
    end: to,
  };
}

export function localBounds(elementRect, containerRect) {
  const left = elementRect.left - containerRect.left;
  const top = elementRect.top - containerRect.top;
  const width = elementRect.width;
  const height = elementRect.height;
  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    cx: left + width / 2,
    cy: top + height / 2,
  };
}
