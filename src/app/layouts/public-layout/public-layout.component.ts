import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLinkActive],
  template: `
<div class="min-h-screen text-on-surface">

  <!-- Top nav — same style as landing page -->
  <nav class="fixed top-0 w-full h-16 z-50 bg-white/10 backdrop-blur-md shadow-[0_0_40px_rgba(108,92,231,0.12)]">
    <div class="flex justify-between items-center px-8 w-full max-w-screen-2xl mx-auto h-full relative">

      <!-- Logo -->
      <a routerLink="/home" class="text-2xl font-black text-white tracking-tighter flex items-center gap-2">
        CPS
        <span class="text-xs font-mono text-primary px-2 py-0.5 bg-primary/10 rounded-full tracking-normal">HUB</span>
      </a>

      <!-- Nav links -->
      <div class="hidden md:flex items-center space-x-8 font-medium text-sm tracking-tight">
        <a routerLink="/home"
           routerLinkActive="text-violet-400 border-b-2 border-violet-500 pb-1 font-semibold"
           [routerLinkActiveOptions]="{exact:true}"
           class="text-slate-300 hover:text-white transition-colors">Home</a>
        <a routerLink="/missions"
           routerLinkActive="text-violet-400 border-b-2 border-violet-500 pb-1 font-semibold"
           class="text-slate-300 hover:text-white transition-colors">Missions</a>
        <a routerLink="/report"
           routerLinkActive="text-violet-400 border-b-2 border-violet-500 pb-1 font-semibold"
           class="text-slate-300 hover:text-white transition-colors">Report</a>
        <a routerLink="/help"
           routerLinkActive="text-violet-400 border-b-2 border-violet-500 pb-1 font-semibold"
           class="text-slate-300 hover:text-white transition-colors">Get Help</a>
        <a routerLink="/incidents"
           routerLinkActive="text-violet-400 border-b-2 border-violet-500 pb-1 font-semibold"
           class="text-slate-300 hover:text-white transition-colors">My Reports</a>
      </div>

      <!-- Right actions -->
      <div class="flex items-center gap-4">
        <button class="material-symbols-outlined text-slate-300 hover:text-white transition-all hover:bg-white/5 p-2 rounded-full">
          notifications
        </button>
        <div class="h-6 w-[1px] bg-white/10 mx-1"></div>
        <div class="w-8 h-8 rounded-full border border-primary/50 bg-primary/20 flex items-center justify-center text-xs font-black text-primary">
          V
        </div>
        <!-- Mobile menu button -->
        <button class="md:hidden material-symbols-outlined text-slate-300 hover:text-white transition-all">
          menu
        </button>
      </div>

      <div class="bg-gradient-to-r from-violet-500/20 to-transparent h-[1px] bottom-0 absolute left-0 right-0"></div>
    </div>
  </nav>

  <!-- Page content -->
  <main class="pt-16 min-h-screen">
    <router-outlet></router-outlet>
  </main>

  <!-- Footer -->
  <footer class="border-t border-white/5 bg-slate-950/80 backdrop-blur-xl mt-16">
    <div class="max-w-7xl mx-auto px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p class="text-slate-500 text-xs">Powered by DisasterAid ⊕ VolunteerHub © 2025</p>
      <div class="flex gap-6 text-xs text-slate-500">
        <a routerLink="/home" class="hover:text-white transition-colors">Home</a>
        <a routerLink="/report" class="hover:text-white transition-colors">Report</a>
        <a routerLink="/missions" class="hover:text-white transition-colors">Missions</a>
      </div>
    </div>
  </footer>
</div>
  `
})
export class PublicLayoutComponent {}
