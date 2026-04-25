import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ChatComponent } from '../../modules/communication/chat/chat.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ChatComponent],
  templateUrl: './public-layout.component.html',
  styleUrls: ['./public-layout.component.scss']
})
export class PublicLayoutComponent implements OnInit {
  isAuthenticated = false;
  isChatOpen = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.checkAuthState();
  }

  checkAuthState(): void {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const email = localStorage.getItem('email');
    this.isAuthenticated = !!(token && userId && email);
    if (!this.isAuthenticated) {
      this.isChatOpen = false;
    }
  }

  toggleChat(): void {
    this.checkAuthState();
    if (!this.isAuthenticated) {
      this.router.navigateByUrl('/login');
      return;
    }
    this.isChatOpen = !this.isChatOpen;
  }

  closeChat(): void {
    this.isChatOpen = false;
  }

  logout(): void {
    localStorage.clear();
    this.isAuthenticated = false;
    this.router.navigateByUrl('/landing');
  }
}
