import React from "react";
import { BaseEdge, getBezierPath, EdgeProps } from "@xyflow/react";

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
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      markerStart={markerStart}
      interactionWidth={interactionWidth ?? 24}
      style={{
        stroke: "#64748b",
        strokeWidth: 2,
        shapeRendering: "geometricPrecision",
        ...style,
      }}
    />
  );
};

export default CustomEdge;
