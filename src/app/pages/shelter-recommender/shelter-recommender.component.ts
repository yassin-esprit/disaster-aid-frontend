import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FrontOfficeLayoutComponent } from '../../layouts/front-office-layout/front-office-layout.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface RecommendationRequest {
  lat: number;
  lng: number;
  maxDistanceKm: number;
  needsMedical: boolean;
  needsAccessible: boolean;
  hasPets: boolean;
  peopleCount: number;
}

interface RecommendationItem {
  id: number;
  name: string;
  type: 'LOCAL' | 'MEDICAL';
  status: 'AVAILABLE' | 'FULL' | 'CLOSED';
  capacity: number;
  occupancy: number;
  remaining: number;
  distanceKm: number;
  score: number;
  reasons: string[];
}

interface RecommendationResponse {
  recommendations: RecommendationItem[];
}

@Component({
  selector: 'app-shelter-recommender',
  standalone: true,
  imports: [CommonModule, FormsModule, FrontOfficeLayoutComponent],
  templateUrl: './shelter-recommender.component.html',
  styleUrl: './shelter-recommender.component.scss',
})
export class ShelterRecommenderComponent {
  request: RecommendationRequest = {
    lat: 36.8065,
    lng: 10.1815,
    maxDistanceKm: 40,
    needsMedical: false,
    needsAccessible: false,
    hasPets: false,
    peopleCount: 1,
  };

  isLoading = false;
  hasSearched = false;
  errorMessage = '';
  recommendations: RecommendationItem[] = [];

  constructor(private readonly http: HttpClient) {}

  findRecommendations(): void {
    this.isLoading = true;
    this.hasSearched = true;
    this.errorMessage = '';
    this.recommendations = [];

    const payload: RecommendationRequest = {
      lat: Number(this.request.lat),
      lng: Number(this.request.lng),
      maxDistanceKm: Number(this.request.maxDistanceKm),
      needsMedical: !!this.request.needsMedical,
      needsAccessible: !!this.request.needsAccessible,
      hasPets: !!this.request.hasPets,
      peopleCount: Math.max(1, Number(this.request.peopleCount) || 1),
    };

    this.http
      .post<RecommendationResponse>(
        `${environment.apiUrl}/shelters/recommend`,
        payload,
      )
      .subscribe({
        next: (response) => {
          this.recommendations = response.recommendations ?? [];
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage =
            'Unable to load recommendations. Please check that backend is running on port 8090.';
          this.isLoading = false;
        },
      });
  }

  isAvailable(item: RecommendationItem): boolean {
    return item.status === 'AVAILABLE' && item.remaining > 0;
  }
}
