import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DiscussionRequestService } from '../../../core/services/discussion-request.service';

@Component({
  selector: 'app-request-discussion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './request-discussion.component.html',
  styleUrls: ['./request-discussion.component.scss']
})
export class RequestDiscussionComponent {
  subject = '';
  description = '';
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(private discussionRequestService: DiscussionRequestService) {}

  submitRequest(): void {
    this.successMessage = '';
    this.errorMessage = '';

    const citizenId = Number(localStorage.getItem('userId'));

    if (!citizenId) {
      this.errorMessage = 'Utilisateur non connecté.';
      return;
    }

    if (!this.subject.trim() || !this.description.trim()) {
      this.errorMessage = 'Veuillez remplir tous les champs.';
      return;
    }

    this.isSubmitting = true;

    this.discussionRequestService.createRequest(citizenId, {
      subject: this.subject.trim(),
      description: this.description.trim()
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.subject = '';
        this.description = '';
        this.successMessage = 'Votre demande a été envoyée à un administrateur.';
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error(error);
        this.errorMessage = 'Erreur lors de l’envoi de la demande.';
      }
    });
  }
}