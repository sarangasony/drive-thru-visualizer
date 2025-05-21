import { ScalingService } from './scaling.service';
import { Vertex, Lane, Coordinates, Adjacent, VertexType } from '../models/lane.model'; // Ensure VertexType is imported if used in tests

// Helper function to create a test Lane object
const createTestLane = (
  vertices: Vertex[],
  id: string = 'test-lane',
  name: string = 'Test Lane'
): Lane => ({
  id,
  name,
  vertices,
});

describe('ScalingService', () => {
  let service: ScalingService;

  // Define viewport dimensions and margin percentage for tests
  const VIEWPORT_WIDTH = 1920;
  const VIEWPORT_HEIGHT = 1080;
  const MARGIN_PERCENTAGE = 0.05;
  const precision = 0.001; // For toBeCloseTo assertions

  beforeEach(() => {
    service = new ScalingService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('scaleLane method', () => {
    const squareLaneVertices: Vertex[] = [
      {
        id: 0,
        name: 'A',
        vertexType: "SERVICE_POINT", 
        isEntry: true,
        location: { coordinates: [0, 0] },
        adjacent: [{ adjacentVertex: 1, interiorPath: [] }],
      },
      {
        id: 1,
        name: 'B',
        vertexType: "SERVICE_POINT",
        isEntry: false,
        location: { coordinates: [10, 0] },
        adjacent: [{ adjacentVertex: 2, interiorPath: [] }],
      },
      {
        id: 2,
        name: 'C',
        vertexType: "SERVICE_POINT",
        isEntry: false,
        location: { coordinates: [10, 10] },
        adjacent: [{ adjacentVertex: 3, interiorPath: [] }],
      },
      {
        id: 3,
        name: 'D',
        vertexType: "SERVICE_POINT",
        isEntry: false,
        location: { coordinates: [0, 10] },
        adjacent: [{ adjacentVertex: 0, interiorPath: [] }],
      },
    ];
    const squareLane = createTestLane(squareLaneVertices);

    // Lane 1 data (from assignment)
    const lane1Vertices: Vertex[] = [
      {
        id: 0,
        name: 'Pre-Warn',
        vertexType: "SERVICE_POINT",
        isEntry: true,
        location: { coordinates: [18.0, 2.0] },
        adjacent: [{ adjacentVertex: 1, interiorPath: [] }],
      },
      {
        id: 1,
        name: 'Order',
        vertexType: "SERVICE_POINT",
        isEntry: false,
        location: { coordinates: [18.0, 7.0] },
        adjacent: [
          { adjacentVertex: 2, interiorPath: [{ coordinates: [18, 9.5] }] },
        ],
      },
      {
        id: 2,
        name: 'Cash',
        vertexType: "SERVICE_POINT",
        isEntry: false,
        location: { coordinates: [8.0, 9.5] },
        adjacent: [{ adjacentVertex: 3, interiorPath: [] }],
      },
      {
        id: 3,
        name: 'Present',
        vertexType: "SERVICE_POINT", // Added vertexType
        isEntry: false,
        location: { coordinates: [0.5, 9.5] },
        adjacent: [],
      },
    ];
    const lane1 = createTestLane(lane1Vertices);

    it('should return default data and core values for empty vertices array', () => {
      const emptyLane = createTestLane([]);
      const result = service.scaleLane(
        emptyLane,
        VIEWPORT_WIDTH,
        VIEWPORT_HEIGHT,
        MARGIN_PERCENTAGE
      );

      // Assertions for explicitly returned values
      expect(result.scaledVertices).toEqual([]);
      expect(result.pathData).toBe('');
      expect(result.calculatedLaneWidthPx).toBe(0);
   
    });

    it('should calculate calculatedLaneWidthPx correctly for a normal lane', () => {
        const result = service.scaleLane(
            squareLane,
            VIEWPORT_WIDTH,
            VIEWPORT_HEIGHT,
            MARGIN_PERCENTAGE
        );

        const worldWidth = 10; // For squareLane
        const effectiveViewportWidth = VIEWPORT_WIDTH * (1 - 2 * MARGIN_PERCENTAGE);
        const effectiveViewportHeight = VIEWPORT_HEIGHT * (1 - 2 * MARGIN_PERCENTAGE);
        const scaleX = effectiveViewportWidth / worldWidth;
        const scaleY = effectiveViewportHeight / worldWidth; // Assuming worldWidth is max dimension here too
        const expectedScale = Math.min(scaleX, scaleY); // 97.2

        const LANE_WORLD_WIDTH_METERS = 2.5; // From ScalingService
        const expectedCalculatedLaneWidthPx = LANE_WORLD_WIDTH_METERS * expectedScale;

        expect(result.calculatedLaneWidthPx).toBeCloseTo(expectedCalculatedLaneWidthPx, precision);
    });

    it('should return 0 for calculatedLaneWidthPx if the lane has zero world width', () => {
      const zeroWidthVertices: Vertex[] = [
        { id: 0, name: 'A', location: { coordinates: [5, 5] }, adjacent: [] },
        { id: 1, name: 'B', location: { coordinates: [5, 10] }, adjacent: [] }, // Vertical line
      ];
      const zeroWidthLane = createTestLane(zeroWidthVertices);
      const result = service.scaleLane(
        zeroWidthLane,
        VIEWPORT_WIDTH,
        VIEWPORT_HEIGHT,
        MARGIN_PERCENTAGE
      );
      expect(result.calculatedLaneWidthPx).toBe(0); // Specific to this property
    });

  });
});