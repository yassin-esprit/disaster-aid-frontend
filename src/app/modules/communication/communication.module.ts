import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommunicationRoutingModule } from './communication-routing.module';
import { FormsModule } from '@angular/forms';
import { ChatComponent } from './chat/chat.component';

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    CommunicationRoutingModule,
    FormsModule
  ]
})
export class CommunicationModule { }