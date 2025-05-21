// src/app/services/scaling.service.spec.ts
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
    // A simple 10x10 meter square lane for testing
    const squareLaneVertices: Vertex[] = [
      {
        id: 0,
        name: 'A',
        vertexType: VertexType.SERVICE_POINT, // Added vertexType for completeness
        isEntry: true,
        location: { coordinates: [0, 0] },
        adjacent: [{ adjacentVertex: 1, interiorPath: [] }],
      },
      {
        id: 1,
        name: 'B',
        vertexType: VertexType.SERVICE_POINT,
        isEntry: false,
        location: { coordinates: [10, 0] },
        adjacent: [{ adjacentVertex: 2, interiorPath: [] }],
      },
      {
        id: 2,
        name: 'C',
        vertexType: VertexType.SERVICE_POINT,
        isEntry: false,
        location: { coordinates: [10, 10] },
        adjacent: [{ adjacentVertex: 3, interiorPath: [] }],
      },
      {
        id: 3,
        name: 'D',
        vertexType: VertexType.SERVICE_POINT,
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
        vertexType: VertexType.SERVICE_POINT,
        isEntry: true,
        location: { coordinates: [18.0, 2.0] },
        adjacent: [{ adjacentVertex: 1, interiorPath: [] }],
      },
      {
        id: 1,
        name: 'Order',
        vertexType: VertexType.SERVICE_POINT,
        isEntry: false,
        location: { coordinates: [18.0, 7.0] },
        adjacent: [
          { adjacentVertex: 2, interiorPath: [{ coordinates: [18, 9.5] }] },
        ],
      },
      {
        id: 2,
        name: 'Cash',
        vertexType: VertexType.SERVICE_POINT,
        isEntry: false,
        location: { coordinates: [8.0, 9.5] },
        adjacent: [{ adjacentVertex: 3, interiorPath: [] }],
      },
      {
        id: 3,
        name: 'Present',
        vertexType: VertexType.SERVICE_POINT, // Added vertexType
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

      // Assertions for core transformation values for empty input
      expect(result.scale).toBe(1); // Default scale when no dimensions to fit
      expect(result.translateX).toBe(0);
      expect(result.translateY).toBe(0);
      expect(result.scaledWorldWidth).toBe(0);
      expect(result.scaledWorldHeight).toBe(0);
    });

    it('should scale and position a simple square lane correctly', () => {
      const result = service.scaleLane(
        squareLane,
        VIEWPORT_WIDTH,
        VIEWPORT_HEIGHT,
        MARGIN_PERCENTAGE
      );

      const worldMinX = 0;
      const worldMaxX = 10;
      const worldMinY = 0;
      const worldMaxY = 10;
      const worldWidth = worldMaxX - worldMinX; // 10
      const worldHeight = worldMaxY - worldMinY; // 10

      const effectiveViewportWidth = VIEWPORT_WIDTH * (1 - 2 * MARGIN_PERCENTAGE); // 1728
      const effectiveViewportHeight = VIEWPORT_HEIGHT * (1 - 2 * MARGIN_PERCENTAGE); // 972

      const scaleX = effectiveViewportWidth / worldWidth; // 172.8
      const scaleY = effectiveViewportHeight / worldHeight; // 97.2

      const expectedScale = Math.min(scaleX, scaleY); // 97.2

      const expectedScaledWorldWidth = worldWidth * expectedScale; // 972
      const expectedScaledWorldHeight = worldHeight * expectedScale; // 972

      // Calculate expected translateX based on service logic:
      // (viewportWidth - scaledWorldWidth) / 2 - (minX_world * scale)
      const expectedTranslateX = (VIEWPORT_WIDTH - expectedScaledWorldWidth) / 2 - (worldMinX * expectedScale); // (1920 - 972) / 2 - (0 * 97.2) = 474

      // Calculate expected translateY based on service logic (Y-flip handled internally):
      // (viewportHeight - scaledWorldHeight) / 2
      const expectedTranslateY = (VIEWPORT_HEIGHT - expectedScaledWorldHeight) / 2; // (1080 - 972) / 2 = 54

      expect(result.scale).toBeCloseTo(expectedScale, precision);
      expect(result.translateX).toBeCloseTo(expectedTranslateX, precision);
      expect(result.translateY).toBeCloseTo(expectedTranslateY, precision);
      expect(result.scaledWorldWidth).toBeCloseTo(expectedScaledWorldWidth, precision);
      expect(result.scaledWorldHeight).toBeCloseTo(expectedScaledWorldHeight, precision);

      // Optional: Test a few scaled vertex coordinates if needed
      const scaledA = result.scaledVertices.find(v => v.originalVertex.id === 0);
      const scaledA_expected_x = 0 * expectedScale + expectedTranslateX;
      const scaledA_expected_y = (worldMaxY - 0) * expectedScale + expectedTranslateY; // (maxY_world - y_world) * scale + translateY
      expect(scaledA?.x).toBeCloseTo(scaledA_expected_x, precision);
      expect(scaledA?.y).toBeCloseTo(scaledA_expected_y, precision);
    });

    it('should handle lanes with interiorPath coordinates and scale correctly', () => {
      const result = service.scaleLane(
        lane1,
        VIEWPORT_WIDTH,
        VIEWPORT_HEIGHT,
        MARGIN_PERCENTAGE
      );

      // Define min/max for Lane 1 based on its vertices and interior path points
      // Vertices: (18,2), (18,7), (8,9.5), (0.5,9.5)
      // Interior Path: (18,9.5)
      const minX_world = 0.5;
      const maxX_world = 18.0;
      const minY_world = 2.0;
      const maxY_world = 9.5;

      const worldWidth = maxX_world - minX_world; // 17.5
      const worldHeight = maxY_world - minY_world; // 7.5

      const effectiveViewportWidth = VIEWPORT_WIDTH * (1 - 2 * MARGIN_PERCENTAGE); // 1728
      const effectiveViewportHeight = VIEWPORT_HEIGHT * (1 - 2 * MARGIN_PERCENTAGE); // 972

      const scaleX = effectiveViewportWidth / worldWidth; // 1728 / 17.5 = 98.742857...
      const scaleY = effectiveViewportHeight / worldHeight; // 972 / 7.5 = 129.6

      const expectedScale = Math.min(scaleX, scaleY); // 98.742857...

      const expectedScaledWorldWidth = worldWidth * expectedScale; // 17.5 * 98.742857 = 1728
      const expectedScaledWorldHeight = worldHeight * expectedScale; // 7.5 * 98.742857 = 740.571428...

      // Calculate expected offsets based on service logic
      const expectedTranslateX = (VIEWPORT_WIDTH - expectedScaledWorldWidth) / 2 - (minX_world * expectedScale);
      const expectedTranslateY = (VIEWPORT_HEIGHT - expectedScaledWorldHeight) / 2;

      expect(result.scale).toBeCloseTo(expectedScale, precision);
      expect(result.translateX).toBeCloseTo(expectedTranslateX, precision);
      expect(result.translateY).toBeCloseTo(expectedTranslateY, precision);
      expect(result.scaledWorldWidth).toBeCloseTo(expectedScaledWorldWidth, precision);
      expect(result.scaledWorldHeight).toBeCloseTo(expectedScaledWorldHeight, precision);

      // Optional: Assertions for scaled vertices or pathData, if desired.
      // Example for vertex 0 ('Pre-Warn'):
      // const scaledV0 = result.scaledVertices.find(v => v.originalVertex.id === 0);
      // const expectedV0X = 18.0 * expectedScale + expectedTranslateX;
      // const expectedV0Y = (maxY_world - 2.0) * expectedScale + expectedTranslateY; // (maxY_world - y_world) * scale + translateY
      // expect(scaledV0?.x).toBeCloseTo(expectedV0X, precision);
      // expect(scaledV0?.y).toBeCloseTo(expectedV0Y, precision);
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
      expect(result.scaledWorldWidth).toBe(0); // The overall scaled bounding box width
    });


    it('should handle single point lane gracefully', () => {
      const singlePointVertices: Vertex[] = [
        { id: 0, name: 'A', location: { coordinates: [5, 5] }, adjacent: [] },
      ];
      const singlePointLane = createTestLane(singlePointVertices);
      const result = service.scaleLane(
        singlePointLane,
        VIEWPORT_WIDTH,
        VIEWPORT_HEIGHT,
        MARGIN_PERCENTAGE
      );

      // For a single point, scale should be 1, and it should be centered.
      // Service logic for _calculateScaleAndTransform handles worldWidth/Height = 0 by using effectiveWorldWidth/Height = 1
      // and then calculating scale=1. Then scaledWorldWidth/Height will be 0.
      const expectedScale = 1;
      const worldPointX = 5;
      const worldPointY = 5;

      // TranslateX: (viewportWidth - scaledWorldWidth) / 2 - (minX * scale)
      // (1920 - 0) / 2 - (5 * 1) = 960 - 5 = 955
      const expectedTranslateX = (VIEWPORT_WIDTH - 0) / 2 - (worldPointX * expectedScale);

      // TranslateY: (viewportHeight - scaledWorldHeight) / 2
      // (1080 - 0) / 2 = 540
      const expectedTranslateY = (VIEWPORT_HEIGHT - 0) / 2;


      expect(result.scale).toBe(expectedScale);
      expect(result.translateX).toBeCloseTo(expectedTranslateX, precision);
      expect(result.translateY).toBeCloseTo(expectedTranslateY, precision);
      expect(result.scaledWorldWidth).toBe(0); // Scaled width of bounding box is 0
      expect(result.scaledWorldHeight).toBe(0); // Scaled height of bounding box is 0
      expect(result.calculatedLaneWidthPx).toBe(0); // Specific lane width is 0 for single point

      // Also check that the single vertex is correctly scaled and translated
      expect(result.scaledVertices.length).toBe(1);
      const scaledVertex = result.scaledVertices[0];
      const expectedVertexScreenX = worldPointX * expectedScale + expectedTranslateX;
      const expectedVertexScreenY = (worldPointY * -1) * expectedScale + expectedTranslateY + (worldPointY * expectedScale * 2); // For Y-flip, (maxY - y) becomes (5-5) is 0. So it's 0*scale + 540
      // Actually, my scaling service has (maxY - y) * scale + offsetY, which is (5-5)*1 + 540 = 540.
      // So expected vertex Y should be 540.
      // Let's re-calculate expectedScaledY for the vertex itself:
      // In _calculateScaleAndTransform: minX=5, maxX=5, minY=5, maxY=5
      // transformCoord: (maxY - y) * scale + translateY = (5 - 5) * 1 + 540 = 540
      expect(scaledVertex.x).toBeCloseTo(worldPointX * expectedScale + expectedTranslateX, precision);
      expect(scaledVertex.y).toBeCloseTo((worldPointY * -1) * expectedScale + expectedTranslateY + (worldPointY * expectedScale * 2), precision);
    });
  });
});