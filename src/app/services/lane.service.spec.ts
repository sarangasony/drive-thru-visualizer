import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http'; 
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LaneService } from './lane.service';
import {  Lane, Vertex } from '../models/lane.model';

describe('LaneService', () => {
  let service: LaneService;
  let httpTestingController: HttpTestingController;

  const mockLane: Lane = {
    id: '680bc0',
    name: 'Test Lane',
    vertices:[]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LaneService, 
        provideHttpClient(),
        provideHttpClientTesting() 
      ]
    });

    service = TestBed.inject(LaneService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify(); 
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should retrieve a lane by ID', () => {
    const testLaneId = 'test-lane-id';
    const mockLane:Lane  =  {
      id: testLaneId,
      name: 'Mock Lane',
      vertices: [
        {
          id: 0,
          name: 'A',
          vertexType: "SERVICE_POINT",
          isEntry: false,
          location: {
            coordinates: [
              0,
              0
            ]
          },
          adjacent:[]
        }
      ]
    };

    service.getLane(testLaneId).subscribe(lane => {
      expect(lane).toEqual(mockLane);
    });

    const req = httpTestingController.expectOne(`http://localhost:3000/lanes/${testLaneId}`); 
    expect(req.request.method).toEqual('GET');
    req.flush(mockLane); 
  });

  it('should return cached lane on second call (cache hit)', () => {
    // First call — triggers HTTP request
    service.getLane('680bc0').subscribe();

    const req = httpTestingController.expectOne('http://localhost:3000/lanes/680bc0');
    req.flush(mockLane);

    // Second call — should use cache, no new request
    service.getLane('680bc0').subscribe(data => {
      expect(data).toEqual(mockLane);
    });

    // Ensure no second HTTP request was made
    httpTestingController.expectNone('http://localhost:3000/lanes/680bc0');
  });
});