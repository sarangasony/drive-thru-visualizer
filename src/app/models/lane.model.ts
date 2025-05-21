export interface Coordinates {
  coordinates: [number, number];
}

export interface Adjacent {
  adjacentVertex: number;
  interiorPath: Coordinates[];
}

export type VertexType = "SERVICE_POINT" | "PRE_MERGE_POINT" | "LANE_MERGE";

export interface Vertex {
  id: number;
  name: string;
  vertexType?: VertexType;
  isEntry?: boolean;
  location: Coordinates;
  adjacent: Adjacent[];
}

export interface Lane {
  id: string;
  name: string;
  vertices: Vertex[];
}