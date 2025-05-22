import { Injectable } from '@angular/core';
import { Coordinates, Vertex, Lane } from '../models/lane.model';

interface ScaledVertex {
  originalVertex: Vertex;
  x: number;
  y: number;
}

interface ScaleTransformResult {
  scale: number;
  translateX: number;
  translateY: number;
  minX: number;
  maxY: number;
  worldWidth: number;
  worldHeight: number;
  scaledWorldWidth: number;
  scaledWorldHeight: number;
}

@Injectable({
  providedIn: 'root'
})
export class ScalingService {
  private readonly LANE_WORLD_WIDTH_METERS = 2.5;

  constructor() { }

   /**
   * Private helper function to calculate the core scaling factor and translation offsets.
   * This function determines how the world coordinates should map to the viewport.
   * @param lane The Lane object containing vertices.
   * @param viewportWidth The target display width.
   * @param viewportHeight The target display height.
   * @param marginPercentage The desired margin as a percentage.
   * @returns An object containing the calculated scale, translation offsets, and world bounds.
   */
  private _calculateScaleAndTransform(
    lane: Lane,
    viewportWidth: number,
    viewportHeight: number,
    marginPercentage: number
  ): ScaleTransformResult {
    const vertices = lane.vertices;

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    vertices.forEach(vertex => {
      const [vx, vy] = vertex.location.coordinates;
      minX = Math.min(minX, vx);
      minY = Math.min(minY, vy);
      maxX = Math.max(maxX, vx);
      maxY = Math.max(maxY, vy);

      vertex.adjacent?.forEach(adj => {
        adj.interiorPath?.forEach(pathCoord => {
          const [px, py] = pathCoord.coordinates;
          minX = Math.min(minX, px);
          minY = Math.min(minY, py);
          maxX = Math.max(maxX, px);
          maxY = Math.max(maxY, py);
        });
      });
    });

    const worldWidth = maxX - minX;
    const worldHeight = maxY - minY;

    const effectiveWorldWidth = worldWidth > 0 ? worldWidth : 1;
    const effectiveWorldHeight = worldHeight > 0 ? worldHeight : 1;

    const effectiveViewportWidth = viewportWidth * (1 - 2 * marginPercentage);
    const effectiveViewportHeight = viewportHeight * (1 - 2 * marginPercentage);

    const scaleX = effectiveViewportWidth / effectiveWorldWidth;
    const scaleY = effectiveViewportHeight / effectiveWorldHeight;

    const scale = Math.min(scaleX, scaleY);

    const finalScaledWorldWidth = worldWidth * scale;
    const finalScaledWorldHeight = worldHeight * scale;

    const translateX = (viewportWidth * marginPercentage) +
                       ((effectiveViewportWidth - finalScaledWorldWidth) / 2) -
                       (minX * scale);

    const translateY = (viewportHeight * marginPercentage) +
                       ((effectiveViewportHeight - finalScaledWorldHeight) / 2);
  
    return { scale, translateX, translateY, minX, maxY, worldWidth, worldHeight, scaledWorldWidth: finalScaledWorldWidth, scaledWorldHeight: finalScaledWorldHeight };
  }

  /**
   * Calculates the scaling factor and transforms world coordinates to screen coordinates.
   * Ensures the lane fits within the viewport with a defined margin.
   * This public method orchestrates the scaling, coordinate transformation, and SVG path generation.
   * @param lane The Lane object containing vertices with world coordinates.
   * @param viewportWidth The target display width (e.g., 1920px).
   * @param viewportHeight The target display height (e.g., 1080px).
   * @param marginPercentage The desired margin as a percentage (e.g., 0.05 for 5%).
   * @returns An object containing scaled vertices, SVG path data, and calculated lane width in pixels.
   */

  public scaleLane(
    lane: Lane,
    viewportWidth: number,
    viewportHeight: number,
    marginPercentage: number
  ): { scaledVertices: ScaledVertex[], pathData: string, calculatedLaneWidthPx: number, laneTransform: ScaleTransformResult } { // <-- Added laneTransform to return type

    if (!lane || !lane.vertices || lane.vertices.length === 0) {
      // Return a default empty state, including a default laneTransform
      return {
        scaledVertices: [],
        pathData: '',
        calculatedLaneWidthPx: 0,
        laneTransform: { scale: 0, translateX: 0, translateY: 0, minX: 0, maxY: 0, worldWidth: 0, worldHeight: 0, scaledWorldWidth: 0, scaledWorldHeight: 0 }
      };
    }

    const laneTransform = this._calculateScaleAndTransform(lane, viewportWidth, viewportHeight, marginPercentage);
 
    const { scale, translateX, translateY, minX, maxY, worldWidth, worldHeight} = laneTransform;

    if (lane.vertices.length === 1 && worldWidth === 0 && worldHeight === 0) {
        const [screenX, screenY] = [
          lane.vertices[0].location.coordinates[0] * scale + translateX,
          (maxY - lane.vertices[0].location.coordinates[1]) * scale + translateY // Still use (maxY - y) here
        ];
        const singleScaledVertex: ScaledVertex[] = [{ originalVertex: lane.vertices[0], x: screenX, y: screenY }];
        return { scaledVertices: singleScaledVertex, pathData: '', calculatedLaneWidthPx: 0, laneTransform }; // <-- Return laneTransform here
    }

    const scaledVertices: ScaledVertex[] = [];
    let pathData = '';

    const vertexMap = new Map<number, Vertex>(lane.vertices.map(v => [v.id, v]));

    const transformCoord = (coord: [number, number]): [number, number] => {
      const [x, y] = coord;
      return [
        x * scale + translateX,
        (maxY - y) * scale + translateY // <-- Keep (maxY - y) here for the flip
      ];
    };

    lane.vertices.forEach(vertex => {
      const [screenX, screenY] = transformCoord(vertex.location.coordinates);
      scaledVertices.push({
        originalVertex: vertex,
        x: screenX,
        y: screenY
      });

      vertex.adjacent?.forEach(adj => {
        const adjacentVertex = vertexMap.get(adj.adjacentVertex);
        if (adjacentVertex) {
          const [startPathX, startPathY] = transformCoord(vertex.location.coordinates);
          pathData += `M ${startPathX} ${startPathY} `;

          adj.interiorPath?.forEach(pathCoord => {
            const [pathX, pathY] = transformCoord(pathCoord.coordinates);
            pathData += `L ${pathX} ${pathY} `;
          });

          const [endPathX, endPathY] = transformCoord(adjacentVertex.location.coordinates);
          pathData += `L ${endPathX} ${endPathY} `;
        }
      });
    });

    const calculatedLaneWidthPx = (worldWidth > 0)
        ? (this.LANE_WORLD_WIDTH_METERS * scale)
        : 0;
    return { scaledVertices, pathData, calculatedLaneWidthPx, laneTransform };
  }
}