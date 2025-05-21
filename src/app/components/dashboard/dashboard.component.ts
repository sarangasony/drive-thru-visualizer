// src/app/components/dashboard/dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Lane, Vertex, Coordinates, VertexType } from '../../models/lane.model';
import { LaneService } from '../../services/lane.service';
import { ScalingService } from '../../services/scaling.service'; // <-- Import ScalingService
import { Subscription, filter, switchMap } from 'rxjs';

// Define a type for your processed vertex data
interface DisplayVertex {
  vertex: Vertex;
  screenCoords: Coordinates;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  public readonly VIEWPORT_WIDTH = 1920;
  public readonly VIEWPORT_HEIGHT = 1080;
  private readonly MARGIN_PERCENTAGE = 0.05; // 5% margin

  currentLane: Lane | null = null;
  laneVertices: DisplayVertex[] = [];
  lanePath: string = '';

  // Properties for SVG transform, returned directly from service for the SVG transform string
  svgTransform: string = ''; // No longer directly used as `scaleLane` handles transformations internally
  laneWidthPx: number = 0; // This will now be directly assigned from the service result

  private routeSubscription: Subscription | undefined;

  constructor(
    private route: ActivatedRoute,
    private laneService: LaneService,
    private scalingService: ScalingService // <-- Inject ScalingService
  ) {}

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.pipe(
      filter(params => params.has('id')),
      switchMap(params => {
        const laneId = params.get('id')!;
        return this.laneService.getLane(laneId);
      })
    ).subscribe(lane => {
      this.currentLane = lane;
      if (this.currentLane) {
        this.processLaneData(this.currentLane);
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }

  private processLaneData(lane: Lane): void {
    // Call scaleLane with the entire Lane object
    const { scaledVertices, pathData, calculatedLaneWidthPx } = this.scalingService.scaleLane(
      lane, // <--- PASS THE ENTIRE LANE OBJECT HERE
      this.VIEWPORT_WIDTH,
      this.VIEWPORT_HEIGHT,
      this.MARGIN_PERCENTAGE
    );

    this.laneVertices = scaledVertices.map(sv => ({
      vertex: sv.originalVertex,
      screenCoords: { coordinates: [sv.x, sv.y] }
    }));

    this.lanePath = pathData;
    this.laneWidthPx = calculatedLaneWidthPx;

    // The transform logic is now handled internally by scaleLane,
    // which transforms individual points and generates the path.
    // The svgTransform property is not needed for the overall SVG g element anymore,
    // as the coordinates themselves are already transformed.
    // You might still use a translate if you want to apply the general offset *after* scaling,
    // but the `scaleLane` method already computes and applies all offsets directly to the coordinates.
    // So, remove or re-evaluate `svgTransform` if it's still being used in your HTML.
    // If you plan to keep `svgTransform` in HTML, then `scaleLane` needs to return `scale`, `translateX`, `translateY`
    // instead of pre-scaling vertices and path.

    // Let's re-align with the fact that scaleLane returns *already scaled* coordinates.
    // So, you don't need a top-level SVG transform if your coordinates are already transformed.
    // Re-check your HTML for <svg:g [attr.transform]="svgTransform"> and remove it if coordinates are fully processed.
    // OR if you *do* want a single SVG transform, then the `scaleLane` method should be simplified
    // to just calculate `scale`, `translateX`, `translateY`, and return those, NOT scaledVertices or pathData.

    // Let's assume for now `scaleLane` provides final, scaled coordinates, and thus `svgTransform` can be removed from HTML.
    // If you need it, you'll need to refactor `scaleLane` to return { scale, translateX, translateY } only.
  }

  // Keep these methods as they are
  getVertexShape(vertexType: VertexType | undefined): string {
    if (vertexType === 'SERVICE_POINT') return 'circle';
    if (vertexType === 'PRE_MERGE_POINT') return 'rect';
    if (vertexType === 'LANE_MERGE') return 'triangle';
    return 'circle'; // Default shape
  }

  getVertexColor(vertexType: VertexType | undefined): string {
    if (vertexType === 'SERVICE_POINT') return 'blue';
    if (vertexType === 'PRE_MERGE_POINT') return 'orange';
    if (vertexType === 'LANE_MERGE') return 'red';
    return 'grey'; // Default color
  }

  getTrianglePoints(centerX: number, centerY: number, size: number): string {
    const halfSize = size / 2;
    const height = size * (Math.sqrt(3) / 2); // Height of equilateral triangle
    const topY = centerY - (2 * height / 3);
    const bottomY = centerY + (height / 3);

    const p1 = `${centerX},${topY}`;
    const p2 = `${centerX - halfSize},${bottomY}`;
    const p3 = `${centerX + halfSize},${bottomY}`;

    return `${p1} ${p2} ${p3}`;
  }
}