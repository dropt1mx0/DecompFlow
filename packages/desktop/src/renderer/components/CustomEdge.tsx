import React from "react";
import { BaseEdge, getBezierPath, EdgeProps, useViewport } from "@xyflow/react";

export const CustomEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  markerStart,
  interactionWidth,
}) => {
  const { zoom } = useViewport();

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Dynamically counter-scale strokeWidth against CSS transform scale down
  // so the edge line remains crisp, solid and >= 1.2 physical screen pixels at any zoom level
  const zoomFactor = Math.min(Math.max(zoom, 0.2), 1.1);
  const baseWidth = typeof style.strokeWidth === "number" ? style.strokeWidth : 1.3;
  const responsiveStrokeWidth = Math.max(1.2, baseWidth / zoomFactor);

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      markerStart={markerStart}
      interactionWidth={interactionWidth ?? 24}
      vectorEffect="non-scaling-stroke"
      style={{
        stroke: "rgba(255, 255, 255, 0.35)",
        ...style,
        strokeWidth: responsiveStrokeWidth,
        vectorEffect: "non-scaling-stroke",
        shapeRendering: "geometricPrecision",
      }}
    />
  );
};

export default CustomEdge;
