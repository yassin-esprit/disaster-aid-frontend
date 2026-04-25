import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {Router, RouterModule} from '@angular/router';
import { ChatComponent } from '../../modules/communication/chat/chat.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, ChatComponent ], // Assurez-vous que ce composant est bien importé ici.
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit {
  isAuthenticated = false;
  isChatOpen = false;
  showProfile = false;

  stats = [
    { value: '12', label: 'Active Alerts', color: 'text-error' },
    { value: '4.2k', label: 'Registered Volunteers', color: 'text-primary' },
    { value: '85k+', label: 'Hours Logged', color: 'text-tertiary-dim' },
  ];

  impactNumbers = [
    { value: '142', label: 'Disasters Responded' },
    { value: '4,281', label: 'Volunteers Active' },
    { value: '85.6k', label: 'Hours Logged' },
    { value: '1.2M', label: 'Lives Impacted' },
  ];

  steps = [
    {
      number: '01',
      icon: 'how_to_reg',
      color: 'text-primary',
      bg: 'bg-primary/10',
      title: 'Register Profile',
      description:
        'Securely sign up with your credentials and list your specific skills (First Aid, Logistics, Tech, etc.).',
    },
    {
      number: '02',
      icon: 'notifications_active',
      color: 'text-secondary',
      bg: 'bg-secondary/10',
      title: 'Get Targeted Alerts',
      description:
        'Receive precision notifications based on your location and expertise when an incident occurs.',
    },
    {
      number: '03',
      icon: 'task_alt',
      color: 'text-tertiary-dim',
      bg: 'bg-tertiary-dim/10',
      title: 'Respond & Log',
      description:
        'Accept missions, coordinate with teams, and log your impact hours directly in the app.',
    },
  ];

  testimonials = [
    {
      quote:
        'During the floods in Sousse, this platform was our lifeline. We knew exactly where to go and what was needed before even leaving our homes.',
      name: 'Amine',
      role: 'Regional Logistics Lead, Sousse',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZSPIZtz7Tu-xE4OUF4PNqd6o7nF4ZEzBhPDJkJRbwXErRe5jkKUIU3reO9jDethT2tZBmtL8nIoC3OKnhVq74x_PH8WbpgruHW7tXuRcipWGvSuQxPye-awRovI5l6AKnFs4jHnSwXYfWsLVZ-IZdD-HWjPJexAgjvgokTY5kk5JX-l16pLmuQHyyUKkp_--gJpY0ZVwfjYNaMLyPhpSYkNtJpLaxBuoay9uL00aY4pIg9ugGwAhpPryEwLP-VUJ-yijM78vikuPg',
    },
    {
      quote:
        'Registering as a digital volunteer allowed me to support the national efforts even while working my day job. Every hour logged feels like it matters.',
      name: 'Leila',
      role: 'Data Analyst, Tunis',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDFGdDsZBD-vBp5ImGxvZTJMCY1pQYYD_udXm-wjWwpGy407guE6z1B_3jg_xo6KGnpYVgBGTWIdgkdWieHbG4TIW8YiKmFVgaQpazNhwdJHQ03UX063AheARIzAOw9q5A4CT2jrWzAR0xVtIDuuNEmn7XjyxiA3d0M_L1iXxzk03HA-9XM16hbEbv8x7eV2af9-IflD1yzQQCSDnyBMGJM_I-U0g7fv9cFV4roW8MuYPse4nkdlpVfS1joGLhLLk09d6ftAycrVrJL',
    },
    {
      quote:
        'The coordination between government agencies and citizen volunteers has never been this efficient. CPS Hub is the future of civil defense.',
      name: 'Hassen',
      role: 'Emergency Agency Liaison',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQuX3z9XrVsVdOKc0IkSHgta_KejRROITRjWF_rJd15R1f84i6KNcqaDj1jgXw5rQRnT34U38ctrdSnAURa0abMkVvXNCMHc0ScG93pBh_vvHYCRCSGdfTGUNqbCNc2IycvExEUkOnp6r_GsMmGffxqEv0GjH5U1hOn3DjI-5Fxo75pTYnMv3FI-dCO9QSJi9ih7WyMZnu-gHvuzxcFcBq0ahHFUyLmnMbIAc3N84MDZZv9jgNcNKxcr_OYfaImuzNgE-I41PAAKEH',
    },
  ];

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

  toggleProfile(): void {
    this.showProfile = !this.showProfile;  // Toggle profile visibility
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
  onRespondToAlerts(): void { this.router.navigate(['/report']); }
  onBrowseOpportunities(): void { this.router.navigate(['/missions']); }
}
