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

    // Calculate the bounding box of all coordinates (vertices and interior paths)
    vertices.forEach(vertex => {
      const [vx, vy] = vertex.location.coordinates;
      minX = Math.min(minX, vx);
      minY = Math.min(minY, vy);
      maxX = Math.max(maxX, vx);
      maxY = Math.max(maxY, vy);

      vertex.adjacent.forEach(adj => {
        adj.interiorPath.forEach(pathCoord => {
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

    // Handle single point or zero-dimension lanes:
    // Use 1 for division if a dimension is zero, but remember the original dimension was zero.
    const effectiveWorldWidth = worldWidth > 0 ? worldWidth : 1;
    const effectiveWorldHeight = worldHeight > 0 ? worldHeight : 1;

    // Calculate Scaling Factors
    const effectiveViewportWidth = viewportWidth * (1 - 2 * marginPercentage);
    const effectiveViewportHeight = viewportHeight * (1 - 2 * marginPercentage);

    const scaleX = effectiveViewportWidth / effectiveWorldWidth;
    const scaleY = effectiveViewportHeight / effectiveWorldHeight;

    // Use the smaller scale to fit both dimensions within the viewport
    const scale = Math.min(scaleX, scaleY);

    // Calculate Offset to Center the Lane within the effective viewport
    // Use original world dimensions to get final scaled dimensions, which might be 0.
    const scaledWorldWidth = worldWidth * scale;
    const scaledWorldHeight = worldHeight * scale;

    // translateX: Centers the scaled X-range within the viewport,
    // accounting for the minX of the original world coordinates.
    const translateX = (viewportWidth - scaledWorldWidth) / 2 - (minX * scale);

    // translateY: Corrected for Y-axis flip.
    // After (maxY - y) * scale, the Y-coordinates range from 0 (at maxY_world) to scaledWorldHeight (at minY_world).
    // We center this new range [0, scaledWorldHeight] within the viewportHeight.
    const translateY = (viewportHeight - scaledWorldHeight) / 2;

    // ADDED worldWidth and worldHeight to the return object
    return { scale, translateX, translateY, minX, maxY, worldWidth, worldHeight, scaledWorldWidth, scaledWorldHeight };
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
  public scaleLane( // This remains your primary public method
    lane: Lane,
    viewportWidth: number,
    viewportHeight: number,
    marginPercentage: number
  ): { scaledVertices: ScaledVertex[], pathData: string, calculatedLaneWidthPx: number } {

    if (!lane || !lane.vertices || lane.vertices.length === 0) {
      return { scaledVertices: [], pathData: '', calculatedLaneWidthPx: 0 };
    }

    // Utilize the new private helper function to get the core scaling and transformation parameters
    const { scale, translateX, translateY, minX, maxY, worldWidth, worldHeight, scaledWorldWidth, scaledWorldHeight } = // <--- ADDED worldWidth and worldHeight here
      this._calculateScaleAndTransform(lane, viewportWidth, viewportHeight, marginPercentage);

    // If the scaled dimensions are zero (e.g., a single point, or perfectly horizontal/vertical line
    // that effectively has no width/height in its other dimension), return a default state.
    // However, if it's a line, pathData should still be generated. This check primarily for single points.
    if (scaledWorldWidth === 0 && scaledWorldHeight === 0 && lane.vertices.length === 1) {
        // For a single point, we return the scaled vertex, but no path data or lane width.
        const [screenX, screenY] = [
          lane.vertices[0].location.coordinates[0] * scale + translateX,
          (maxY - lane.vertices[0].location.coordinates[1]) * scale + translateY
        ];
        const singleScaledVertex: ScaledVertex[] = [{ originalVertex: lane.vertices[0], x: screenX, y: screenY }];
        return { scaledVertices: singleScaledVertex, pathData: '', calculatedLaneWidthPx: 0 };
    }


    const scaledVertices: ScaledVertex[] = [];
    let pathData = '';

    const vertexMap = new Map<number, Vertex>(lane.vertices.map(v => [v.id, v]));

    // Helper to transform a single coordinate pair using the calculated scale and translation
    const transformCoord = (coord: [number, number]): [number, number] => {
      const [x, y] = coord;
      return [
        x * scale + translateX,
        (maxY - y) * scale + translateY // (MaxY - y) to flip Y-axis
      ];
    };

    lane.vertices.forEach(vertex => {
      const [screenX, screenY] = transformCoord(vertex.location.coordinates);
      scaledVertices.push({
        originalVertex: vertex,
        x: screenX,
        y: screenY
      });

      // Find adjacent vertices to draw paths
      vertex.adjacent.forEach(adj => {
        const adjacentVertex = vertexMap.get(adj.adjacentVertex);
        if (adjacentVertex) {
          // Start point of the path segment
          const [startPathX, startPathY] = transformCoord(vertex.location.coordinates);
          pathData += `M ${startPathX} ${startPathY} `;

          // Add interior path points if any
          adj.interiorPath.forEach(pathCoord => {
            const [pathX, pathY] = transformCoord(pathCoord.coordinates);
            pathData += `L ${pathX} ${pathY} `;
          });

          // End point of the path segment
          const [endPathX, endPathY] = transformCoord(adjacentVertex.location.coordinates);
          pathData += `L ${endPathX} ${endPathY} `;
        }
      });
    });

    // Calculate lane width in pixels based on the scaling factor.
    // If the original worldWidth was 0 (e.g., a vertical line), the scaled lane width in pixels should also be 0.
    const calculatedLaneWidthPx = (worldWidth > 0) // <--- 'worldWidth' is now accessible
      ? this.LANE_WORLD_WIDTH_METERS * scale
      : 0; // If there's no horizontal extent in world coordinates, lane width is 0.

    return { scaledVertices, pathData, calculatedLaneWidthPx };
  }
}