import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Lane } from '../models/lane.model';

@Injectable({
  providedIn: 'root'
})
export class LaneService {
  private apiUrl = 'http://localhost:3000/lanes'; 

  constructor(private http: HttpClient) { }

  getLane(id: string): Observable<Lane> {
    return this.http.get<Lane>(`${this.apiUrl}/${id}`);
  }
}