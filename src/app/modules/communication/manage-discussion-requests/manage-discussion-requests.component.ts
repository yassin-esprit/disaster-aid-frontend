import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiscussionRequestService } from '../../../core/services/discussion-request.service';
import { DiscussionRequest } from '../models/discussion-request.model';

@Component({
  selector: 'app-manage-discussion-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './manage-discussion-requests.component.html',
  styleUrls: ['./manage-discussion-requests.component.scss']
})
export class ManageDiscussionRequestsComponent implements OnInit {
  @Output() requestAccepted = new EventEmitter<number>();

  requests: DiscussionRequest[] = [];
  loading = false;
  errorMessage = '';

  currentAdminId = Number(localStorage.getItem('userId'));

  constructor(private discussionRequestService: DiscussionRequestService) {}

  ngOnInit(): void {
    this.loadPendingRequests();
  }

  loadPendingRequests(): void {
    this.loading = true;
    this.errorMessage = '';

    this.discussionRequestService.getPendingRequests().subscribe({
      next: (data) => {
        this.requests = data || [];
        this.loading = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Erreur lors du chargement des demandes.';
        this.loading = false;
      }
    });
  }

  acceptRequest(requestId: number): void {
    this.discussionRequestService.acceptRequest(requestId, this.currentAdminId).subscribe({
      next: (res) => {
        this.loadPendingRequests();
        if (res.conversationId) {
          this.requestAccepted.emit(res.conversationId);
        }
      },
      error: (error) => {
        console.error(error);
      }
    });
  }

  rejectRequest(requestId: number): void {
    this.discussionRequestService.rejectRequest(requestId, this.currentAdminId).subscribe({
      next: () => {
        this.loadPendingRequests();
      },
      error: (error) => {
        console.error(error);
      }
    });
  }
}