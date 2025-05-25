// src/app/components/dashboard/dashboard.component.ts
import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Lane, Vertex, Coordinates, VertexType } from '../../models/lane.model';
import { LaneService } from '../../services/lane.service';
import { ScalingService } from '../../services/scaling.service'; // <-- Import ScalingService
import { Subscription, filter, switchMap, tap } from 'rxjs';

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

  svgTransform: string = ''; 
  laneWidthPx: number = 0;

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
        this.currentLane = null;
        this.lanePath = '';
        this.laneVertices = [];
      }),

      switchMap(params => {
        const laneId = params.get('id')!;
        return this.laneService.getLane(laneId);
      })
    ).subscribe({ 
      next: (lane: Lane) => {
        this.currentLane = lane;

        setTimeout(() => this.fadeSignal.set(true), 50);

        if (this.currentLane) {
          this.processLaneData(this.currentLane);
        }
      },
      error: (error: any) => {
        console.error('Error loading lane:', error);
      },
      complete: () => {
        console.log('Lane loading process completed.');
      }
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

  getVertexShape(vertexType: VertexType | undefined): string {
    if (vertexType === 'SERVICE_POINT') return 'circle';
    if (vertexType === 'PRE_MERGE_POINT') return 'rect';
    if (vertexType === 'LANE_MERGE') return 'triangle';
    return 'circle'; // Default shape
  }

  getVertexColor(vertexType: VertexType | undefined): string {
    if (vertexType === 'SERVICE_POINT') return '#33a2ff';
    if (vertexType === 'PRE_MERGE_POINT') return '#ffd433';
    if (vertexType === 'LANE_MERGE') return '#ff5233';
    return '#c2bdc4'; // Default color
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