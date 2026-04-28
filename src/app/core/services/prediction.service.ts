import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PredictionPayload {
  volunteer_id: number;
  opportunity_id: number;
  required_proficiency: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  volunteer_proficiency: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  skill_match: boolean;
  proficiency_gap: number;
  endorsement_count: number;
  is_verified: boolean;
  volunteer_skills_count: number;
  days_until_opportunity: number;
}

export interface PredictionResult {
  prediction: 'ACCEPTED' | 'REJECTED';
  probability: number;
}

@Injectable({ providedIn: 'root' })
export class PredictionService {
  private readonly predictUrl = 'http://localhost:5000/predict';

  constructor(private http: HttpClient) {}

  predict(payload: PredictionPayload): Observable<PredictionResult> {
    return this.http.post<PredictionResult>(this.predictUrl, payload);
  }
}
