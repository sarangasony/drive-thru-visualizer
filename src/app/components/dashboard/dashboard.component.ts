// src/app/components/dashboard/dashboard.component.ts
import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Lane, Vertex, Coordinates, VertexType } from '../../models/lane.model';
import { LaneService } from '../../services/lane.service';
import { ScalingService } from '../../services/scaling.service'; // <-- Import ScalingService
import { Subscription, filter, switchMap, tap } from 'rxjs';

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

  fadeSignal = signal(false);

  constructor(
    private route: ActivatedRoute,
    private laneService: LaneService,
    private scalingService: ScalingService // <-- Inject ScalingService
  ) {}

  ngOnInit(): void {
    // Reset fadeSignal when a new lane load starts
    this.fadeSignal.set(false);
    this.routeSubscription = this.route.paramMap.pipe(
      filter(params => params.has('id')),

      tap(() => {
        this.fadeSignal.set(false);
        // Optional: clear previous lane data immediately to show empty state faster
        this.currentLane = null;
        this.lanePath = '';
        this.laneVertices = [];
      }),

      switchMap(params => {
        const laneId = params.get('id')!;
        return this.laneService.getLane(laneId);
      })
    ).subscribe(lane => {
      this.currentLane = lane;

      
      setTimeout(() => this.fadeSignal.set(true), 50);

      if (this.currentLane) {
        this.processLaneData(this.currentLane);
      }
    },
    (error) => {
      console.error('Error loading lane:', error);
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }

  private processLaneData(lane: Lane): void {
    // Call scaleLane with the entire Lane object
    const { scaledVertices, pathData, calculatedLaneWidthPx } = this.scalingService.scaleLane(
      lane, 
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