import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, share, shareReplay } from 'rxjs';
import { Lane } from '../models/lane.model';

@Injectable({
  providedIn: 'root'
})
export class LaneService {
  private apiUrl = 'http://localhost:3000/lanes'; 
  private cache = new Map<string, Observable<any>>();

  constructor(private http: HttpClient) { }

  getLane(id: string): Observable<Lane> {
    const url = `${this.apiUrl}/${id}`;
    // Check if the lane is already cached
    if (this.cache.has(url)) {
       return this.cache.get(url)!;
    }

    const request = this.http.get<Lane>(url).pipe( shareReplay(1) );
    this.cache.set(url, request);

    return request;
  }
}