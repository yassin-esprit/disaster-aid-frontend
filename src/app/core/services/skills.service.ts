import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Skill {
  id?: number;
  name: string;
  slug?: string;
  category: string;
  parentSkillId?: number;
  description?: string;
  isVerifiable?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface VolunteerSkill {
  id?: number;
  volunteerId: number;
  skillId: number;
  proficiency: string;
  isVerified?: boolean;
  verificationDocUrl?: string;
  endorsementCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class SkillsService {
  private skillsBase = `${environment.apiUrl}/v1/skills`;
  private volunteerSkillsBase = `${environment.apiUrl}/v1/volunteer-skills`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Skill[]> {
    return this.http
      .get<ApiResponse<Skill[]>>(this.skillsBase)
      .pipe(map((r) => r.data));
  }

  getById(id: number): Observable<Skill> {
    return this.http
      .get<ApiResponse<Skill>>(`${this.skillsBase}/${id}`)
      .pipe(map((r) => r.data));
  }

  getByCategory(category: string): Observable<Skill[]> {
    return this.http
      .get<ApiResponse<Skill[]>>(`${this.skillsBase}/category/${category}`)
      .pipe(map((r) => r.data));
  }

  create(skill: Skill): Observable<Skill> {
    return this.http
      .post<ApiResponse<Skill>>(this.skillsBase, skill)
      .pipe(map((r) => r.data));
  }

  update(id: number, skill: Skill): Observable<Skill> {
    return this.http
      .put<ApiResponse<Skill>>(`${this.skillsBase}/${id}`, skill)
      .pipe(map((r) => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.skillsBase}/${id}`)
      .pipe(map(() => void 0));
  }

  toggleActive(id: number): Observable<Skill> {
    return this.http
      .patch<ApiResponse<Skill>>(`${this.skillsBase}/${id}/toggle`, {})
      .pipe(map((r) => r.data));
  }

  getAllVolunteerSkills(): Observable<VolunteerSkill[]> {
    return this.http
      .get<ApiResponse<VolunteerSkill[]>>(this.volunteerSkillsBase)
      .pipe(map((r) => r.data));
  }

  getByVolunteerId(volunteerId: number): Observable<VolunteerSkill[]> {
    return this.http
      .get<ApiResponse<VolunteerSkill[]>>(
        `${this.volunteerSkillsBase}/volunteer/${volunteerId}`,
      )
      .pipe(map((r) => r.data));
  }

  addSkillToVolunteer(volunteerSkill: VolunteerSkill): Observable<VolunteerSkill> {
    return this.http
      .post<ApiResponse<VolunteerSkill>>(this.volunteerSkillsBase, volunteerSkill)
      .pipe(map((r) => r.data));
  }

  updateProficiency(
    id: number,
    volunteerSkill: VolunteerSkill,
  ): Observable<VolunteerSkill> {
    return this.http
      .put<ApiResponse<VolunteerSkill>>(
        `${this.volunteerSkillsBase}/${id}`,
        volunteerSkill,
      )
      .pipe(map((r) => r.data));
  }

  deleteVolunteerSkill(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.volunteerSkillsBase}/${id}`)
      .pipe(map(() => void 0));
  }

  endorse(id: number): Observable<VolunteerSkill> {
    return this.http
      .patch<ApiResponse<VolunteerSkill>>(
        `${this.volunteerSkillsBase}/${id}/endorse`,
        {},
      )
      .pipe(map((r) => r.data));
  }

  verify(id: number): Observable<VolunteerSkill> {
    return this.http
      .patch<ApiResponse<VolunteerSkill>>(
        `${this.volunteerSkillsBase}/${id}/verify`,
        {},
      )
      .pipe(map((r) => r.data));
  }
}

@Injectable({ providedIn: 'root' })
export class VolunteerSkillsService {
  private readonly volunteerSkillsBase = `${environment.apiUrl}/v1/volunteer-skills`;

  constructor(private http: HttpClient) {}

  getById(id: number): Observable<VolunteerSkill> {
    return this.http
      .get<ApiResponse<VolunteerSkill>>(`${this.volunteerSkillsBase}/${id}`)
      .pipe(map((r) => r.data));
  }

  updateProficiency(
    id: number,
    volunteerSkill: VolunteerSkill,
  ): Observable<VolunteerSkill> {
    return this.http
      .put<ApiResponse<VolunteerSkill>>(
        `${this.volunteerSkillsBase}/${id}`,
        volunteerSkill,
      )
      .pipe(map((r) => r.data));
  }
}
