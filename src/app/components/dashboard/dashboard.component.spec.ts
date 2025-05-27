// src/app/components/dashboard/dashboard.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { LaneService } from '../../services/lane.service';
import { ScalingService } from '../../services/scaling.service';
import { Lane, Vertex, Coordinates } from '../../models/lane.model';

// For HttpClient mocking
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let laneService: LaneService;
  let scalingService: ScalingService;
  let httpTestingController: HttpTestingController;

  const VIEWPORT_WIDTH = 1920;
  const VIEWPORT_HEIGHT = 1080;
  const MARGIN_PERCENTAGE = 0.05;

  const mockActivatedRoute = {
    paramMap: of(convertToParamMap({ id: 'test-lane-id' }))
  };

  const mockLane: Lane = {
    id: 'test-lane-id',
    name: 'Test Lane',
    vertices: [
      {
        id: 0,
        name: 'A',
        location: { coordinates: [0, 0] },
        adjacent: []
      }
    ]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DashboardComponent,
      ],
      providers: [
        LaneService,
        ScalingService,
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    laneService = TestBed.inject(LaneService);
    scalingService = TestBed.inject(ScalingService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load lane data on initialization', () => {
    spyOn(laneService, 'getLane').and.callThrough();
    spyOn(scalingService, 'scaleLane').and.callThrough();

    fixture.detectChanges();

    expect(laneService.getLane).toHaveBeenCalledWith('test-lane-id');

    const req = httpTestingController.expectOne('http://localhost:3000/lanes/test-lane-id');
    expect(req.request.method).toEqual('GET');
    req.flush(mockLane);

    fixture.detectChanges();

    expect(component.currentLane).toEqual(mockLane);

    expect(scalingService.scaleLane).toHaveBeenCalledWith(
      mockLane,
      VIEWPORT_WIDTH,
      VIEWPORT_HEIGHT,
      MARGIN_PERCENTAGE
    );
  });

  it('should display correct vertex shape for SERVICE_POINT', () => {
    expect(component.getVertexShape('SERVICE_POINT')).toBe('circle');
  });

  it('should display correct vertex color for PRE_MERGE_POINT', () => {
    expect(component.getVertexColor('PRE_MERGE_POINT')).toBe('#ffd433');
  });
});