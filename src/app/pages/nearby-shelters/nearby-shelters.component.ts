import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FrontOfficeLayoutComponent } from '../../layouts/front-office-layout/front-office-layout.component';
import { ResourceShelterService } from '../../core/services/resource-shelter/resource-shelter.service';
import { ShelterEntity } from '../../shared/models/resource-shelter/resource-shelter.model';

type DisasterType = 'flood' | 'fire' | 'earthquake' | 'storm' | 'power_outage' | 'unknown';

interface ChatMessage {
  role: 'assistant' | 'user';
  text: string;
  time: string;
}

interface TriageState {
  disasterType: DisasterType;
  locationAndHazard: string | null;
  hasInjured: boolean | null;
  breathingOrConsciousIssue: boolean | null;
  isSafeNow: boolean | null;
  waterRising: boolean | null;
  wetElectricCables: boolean | null;
  gasSmell: boolean | null;
  thickSmoke: boolean | null;
  peopleCount: number | null;
  vulnerablePeople: boolean | null;
  canEvacuate: boolean | null;
  safeExitKnown: boolean | null;
}

@Component({
  selector: 'app-nearby-shelters',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FrontOfficeLayoutComponent],
  templateUrl: './nearby-shelters.component.html',
  styleUrl: './nearby-shelters.component.scss',
})
export class NearbySheltersComponent {
  shelters: ShelterEntity[] = [];
  isLoading = false;

  chatOpen = true;
  chatInput = '';
  chatMessages: ChatMessage[] = [
    this.newAssistantMessage(
      'I can help. Tell me what is happening (flood, fire, earthquake, storm, power outage), if you are safe now, and if anyone is injured.'
    ),
  ];

  private triageState: TriageState = this.createEmptyTriageState();

  private readonly greetingTokens = [
    'hello',
    'hi',
    'hey',
    'good morning',
    'good evening',
    'salut',
    'bonjour',
  ];

  private readonly dangerNowTokens = [
    'unconscious',
    'not breathing',
    'cannot breathe',
    'difficulty breathing',
    'chest pain',
    'heavy bleeding',
    'electrocution',
    'trapped',
    'child in danger',
    'thick smoke',
    'gas leak',
    'fire spreading',
    'water rising fast',
    'inconscient',
    'ne respire',
    'douleur thoracique',
    'saignement important',
    'fumee epaisse',
    'odeur de gaz',
  ];

  constructor(private readonly resourceShelterService: ResourceShelterService) {
    this.loadShelters();
  }

  loadShelters(): void {
    this.isLoading = true;
    this.resourceShelterService.getAllShelters().subscribe({
      next: (items) => {
        this.shelters = items;
        this.isLoading = false;
      },
      error: () => {
        this.shelters = [];
        this.isLoading = false;
      },
    });
  }

  remaining(item: ShelterEntity): number {
    const value = item.capacity - item.currentOccupancy;
    return value < 0 ? 0 : value;
  }

  isAvailable(item: ShelterEntity): boolean {
    return this.remaining(item) > 0;
  }

  toggleChat(): void {
    this.chatOpen = !this.chatOpen;
  }

  sendChatMessage(): void {
    const userText = this.chatInput.trim();
    if (!userText) {
      return;
    }

    this.chatMessages.push(this.newUserMessage(userText));
    this.chatInput = '';

    const reply = this.buildReply(userText);
    this.chatMessages.push(this.newAssistantMessage(reply));
  }

  useQuickPrompt(prompt: string): void {
    this.chatInput = prompt;
    this.sendChatMessage();
  }

  private buildReply(userText: string): string {
    const text = this.normalize(userText);

    if (this.shouldResetConversation(text)) {
      this.resetTriageState();
      return [
        'Conversation reset.',
        'Hello. I am CPS-SAFE. Tell me what is happening and whether you are safe now.',
        this.safetyReminder(),
      ].join('\n');
    }

    if (this.isGreeting(text)) {
      return [
        'Hello. I am here with you.',
        'Please tell me: what disaster is happening, are you safe now, and are there injuries?',
        this.safetyReminder(),
      ].join('\n');
    }

    if (this.isCapabilityQuestion(text)) {
      return [
        'I can help with flood, fire, earthquake, storm, power outage, and basic first-aid guidance.',
        'Share your exact situation and I will give step-by-step safety actions.',
        this.safetyReminder(),
      ].join('\n');
    }

    if (this.shouldEscalateImmediately(text)) {
      this.updateTriageState(text, userText);
      return this.buildLifeThreatResponse();
    }

    const hasEmergencySignal = this.hasEmergencySignal(text);
    if (!hasEmergencySignal) {
      return [
        'I did not understand your message clearly.',
        'Please describe the situation with simple details, for example:',
        '- "Flood, water rising, 2 people, one child, not safe"',
        '- "Smoke in apartment, exit blocked, one person breathing with difficulty"',
        this.safetyReminder(),
      ].join('\n');
    }

    this.updateTriageState(text, userText);

    const nextQuestion = this.nextPriorityQuestion();
    if (nextQuestion) {
      return [
        'Quick priority question:',
        `- ${nextQuestion}`,
        this.safetyReminder(),
      ].join('\n');
    }

    return this.buildScenarioPlan();
  }

  private updateTriageState(text: string, rawText: string): void {
    if (this.containsAny(text, ['flood', 'inondation', 'water rising', 'eau monte', 'crue'])) {
      this.triageState.disasterType = 'flood';
    } else if (this.containsAny(text, ['fire', 'incendie', 'feu', 'smoke', 'fumee', 'flame'])) {
      this.triageState.disasterType = 'fire';
    } else if (this.containsAny(text, ['earthquake', 'seisme', 'quake', 'tremor', 'secousse'])) {
      this.triageState.disasterType = 'earthquake';
    } else if (this.containsAny(text, ['storm', 'tempete', 'cyclone', 'hurricane', 'strong wind'])) {
      this.triageState.disasterType = 'storm';
    } else if (
      this.containsAny(text, ['power outage', 'blackout', 'no power', 'coupure', 'panne electrique'])
    ) {
      this.triageState.disasterType = 'power_outage';
    }

    if (
      this.triageState.locationAndHazard === null &&
      this.containsAny(text, [
        'flood',
        'fire',
        'smoke',
        'gas',
        'electric',
        'earthquake',
        'storm',
        'power outage',
        'inondation',
        'incendie',
        'fumee',
        'gaz',
      ])
    ) {
      this.triageState.locationAndHazard = rawText.trim();
    }

    const injured = this.parseBoolean(
      text,
      ['injured', 'bleeding', 'burn', 'bless', 'saignement', 'brulure'],
      ['no injury', 'no injuries', 'not injured', 'pas de blesse', 'aucun blesse']
    );
    if (injured !== null) {
      this.triageState.hasInjured = injured;
    }

    const breathing = this.parseBoolean(
      text,
      [
        'unconscious',
        'not breathing',
        'cannot breathe',
        'difficulty breathing',
        'inconscient',
        'ne respire',
      ],
      ['breathing normal', 'fully conscious']
    );
    if (breathing !== null) {
      this.triageState.breathingOrConsciousIssue = breathing;
    }

    const safe = this.parseBoolean(
      text,
      ['safe now', 'we are safe', 'currently safe', 'en securite'],
      ['not safe', 'unsafe', 'pas en securite', 'stuck', 'bloque']
    );
    if (safe !== null) {
      this.triageState.isSafeNow = safe;
    }

    const waterRising = this.parseBoolean(
      text,
      ['water rising', 'water level rising', 'eau monte'],
      ['water not rising', 'eau ne monte pas']
    );
    if (waterRising !== null) {
      this.triageState.waterRising = waterRising;
    }

    const wetWires = this.parseBoolean(
      text,
      ['wet cable', 'wet wire', 'wet wires', 'cable mouille', 'cables mouilles'],
      ['no wet cable', 'no wet wires']
    );
    if (wetWires !== null) {
      this.triageState.wetElectricCables = wetWires;
    }

    const gas = this.parseBoolean(
      text,
      ['gas smell', 'smell gas', 'gas leak', 'odeur de gaz', 'fuite gaz'],
      ['no gas smell', 'pas d odeur de gaz']
    );
    if (gas !== null) {
      this.triageState.gasSmell = gas;
    }

    const smoke = this.parseBoolean(
      text,
      ['thick smoke', 'heavy smoke', 'fumee epaisse'],
      ['no smoke', 'pas de fumee']
    );
    if (smoke !== null) {
      this.triageState.thickSmoke = smoke;
    }

    const vulnerable = this.parseBoolean(
      text,
      ['child', 'children', 'baby', 'elderly', 'disabled', 'enfant', 'bebe', 'handicap'],
      []
    );
    if (vulnerable !== null) {
      this.triageState.vulnerablePeople = vulnerable;
    }

    const canEvacuate = this.parseBoolean(
      text,
      ['can evacuate', 'evacuation possible', 'safe exit', 'sortie sure', 'sortie libre'],
      ['cannot evacuate', 'evacuation impossible', 'exit blocked', 'sortie bloquee']
    );
    if (canEvacuate !== null) {
      this.triageState.canEvacuate = canEvacuate;
    }

    const safeExit = this.parseBoolean(
      text,
      ['safe exit', 'exit clear', 'sortie sure', 'sortie libre'],
      ['no safe exit', 'pas de sortie sure']
    );
    if (safeExit !== null) {
      this.triageState.safeExitKnown = safeExit;
    }

    const peopleCount = this.extractPeopleCount(text);
    if (peopleCount !== null) {
      this.triageState.peopleCount = peopleCount;
    }
  }

  private buildLifeThreatResponse(): string {
    return [
      'Call emergency services immediately (local emergency number).',
      '',
      'Do right now (0-2 min)',
      '- Move away from immediate danger and evacuate through the safest exit.',
      '- If smoke is present: stay low and crawl. Do not use elevators.',
      '- If water and electricity are both present: do not touch cables or devices.',
      '',
      'In the next 10-30 minutes',
      '- Keep children, elderly people, and disabled persons with you.',
      '- If you cannot evacuate: stay near a window and signal your location.',
      '',
      'After / once stable',
      '- Share exact location with responders and follow their instructions.',
      '- Provide only basic first aid when it is safe for you.',
      '',
      this.safetyReminder(),
    ].join('\n');
  }

  private nextPriorityQuestion(): string | null {
    if (!this.triageState.locationAndHazard) {
      return 'Where are you and what exact hazard is present (flood, fire, smoke, gas, electricity, injury)?';
    }

    if (this.triageState.hasInjured === null || this.triageState.breathingOrConsciousIssue === null) {
      return 'Are there injured people? Approximate age? Are they breathing and conscious?';
    }

    if (this.triageState.isSafeNow === null) {
      return 'Are you safe right now (yes/no)?';
    }

    if (
      this.triageState.waterRising === null ||
      this.triageState.wetElectricCables === null ||
      this.triageState.gasSmell === null ||
      this.triageState.thickSmoke === null
    ) {
      return 'Is water rising? Any wet electrical wires? Gas smell? Thick smoke?';
    }

    if (this.triageState.peopleCount === null || this.triageState.vulnerablePeople === null) {
      return 'How many people are with you? Any children, elderly, or disabled persons?';
    }

    if (this.triageState.canEvacuate === null || this.triageState.safeExitKnown === null) {
      return 'Can you evacuate now? Which exit is safe?';
    }

    return null;
  }

  private buildScenarioPlan(): string {
    switch (this.triageState.disasterType) {
      case 'flood':
        return [
          'Do right now (0-2 min)',
          '- Move to higher ground. Avoid basements.',
          '- Do not walk through water if there is current or electrical risk.',
          '- Turn off power only if the breaker is reachable from a dry zone.',
          '',
          'In the next 10-30 minutes',
          '- Prepare a go-bag: IDs, medication, water, phone charger, flashlight.',
          '- Shut off gas if leak is suspected and action is safe.',
          '',
          'After / once stable',
          '- Get electrical systems checked before restoring power.',
          '- Protect property only after all people are safe.',
          '',
          this.safetyReminder(),
        ].join('\n');

      case 'fire':
        return [
          'Do right now (0-2 min)',
          '- Evacuate immediately if fire or smoke is spreading.',
          '- Stay low under smoke. Close doors behind you if possible.',
          '- Do not use elevators.',
          '',
          'In the next 10-30 minutes',
          '- If exit is blocked, shelter near a window and signal location.',
          '- If clothing catches fire: stop, drop, and roll.',
          '',
          'After / once stable',
          '- Do not re-enter until emergency responders allow it.',
          '- Seek medical help for breathing or smoke symptoms.',
          '',
          this.safetyReminder(),
        ].join('\n');

      case 'earthquake':
        return [
          'Do right now (0-2 min)',
          '- Drop, cover, and hold on under sturdy furniture.',
          '- Stay away from windows and falling objects.',
          '',
          'In the next 10-30 minutes',
          '- Move to an open area after shaking stops.',
          '- Expect aftershocks and stay alert.',
          '',
          'After / once stable',
          '- Avoid damaged buildings until inspected.',
          '- Follow official local instructions.',
          '',
          this.safetyReminder(),
        ].join('\n');

      case 'storm':
        return [
          'Do right now (0-2 min)',
          '- Stay indoors, away from windows.',
          '- Avoid flooded roads and downed power lines.',
          '',
          'In the next 10-30 minutes',
          '- Keep flashlight, water, medication, and phone ready.',
          '- Monitor official weather alerts.',
          '',
          'After / once stable',
          '- Check injuries and hazards before moving around.',
          '- Report fallen wires or gas leaks immediately.',
          '',
          this.safetyReminder(),
        ].join('\n');

      case 'power_outage':
        return [
          'Do right now (0-2 min)',
          '- Check people first, especially vulnerable persons.',
          '- Use flashlights instead of candles when possible.',
          '',
          'In the next 10-30 minutes',
          '- Unplug sensitive electronics to avoid surge damage.',
          '- Keep fridge and freezer doors closed.',
          '',
          'After / once stable',
          '- Restore appliances gradually when power returns.',
          '- If you smell burning, disconnect power and call a professional.',
          '',
          this.safetyReminder(),
        ].join('\n');

      default:
        return [
          'Do right now (0-2 min)',
          '- Move everyone away from immediate danger.',
          '- Call emergency services if there is any life risk.',
          '',
          'In the next 10-30 minutes',
          '- Prioritize children, elderly people, and disabled persons.',
          '- Prepare for safe evacuation and keep communication open.',
          '',
          'After / once stable',
          '- Follow local official instructions.',
          '- Handle property damage only when everyone is safe.',
          '',
          this.safetyReminder(),
        ].join('\n');
    }
  }

  private isGreeting(text: string): boolean {
    return this.greetingTokens.some((token) => text === token || text.startsWith(`${token} `));
  }

  private isCapabilityQuestion(text: string): boolean {
    return this.containsAny(text, ['what can you do', 'help me', 'how can you help', 'who are you']);
  }

  private shouldEscalateImmediately(text: string): boolean {
    if (this.containsAny(text, this.dangerNowTokens)) {
      return true;
    }

    return this.containsAny(text, ['not safe', 'unsafe', 'pas en securite']);
  }

  private hasEmergencySignal(text: string): boolean {
    return this.containsAny(text, [
      'flood',
      'fire',
      'smoke',
      'earthquake',
      'storm',
      'power outage',
      'gas',
      'electric',
      'injured',
      'bleeding',
      'burn',
      'evacuate',
      'inondation',
      'incendie',
      'fumee',
      'seisme',
      'tempete',
      'coupure',
      'gaz',
      'blesse',
    ]);
  }

  private normalize(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private containsAny(text: string, tokens: string[]): boolean {
    return tokens.some((token) => text.includes(token));
  }

  private parseBoolean(text: string, trueTokens: string[], falseTokens: string[]): boolean | null {
    if (this.containsAny(text, falseTokens)) {
      return false;
    }

    if (this.containsAny(text, trueTokens)) {
      return true;
    }

    return null;
  }

  private extractPeopleCount(text: string): number | null {
    const match = text.match(/\b(\d{1,2})\b/);
    if (!match) {
      return null;
    }

    const count = Number(match[1]);
    return Number.isNaN(count) ? null : count;
  }

  private shouldResetConversation(text: string): boolean {
    return text === 'reset' || text === 'restart' || text === 'new chat';
  }

  private resetTriageState(): void {
    this.triageState = this.createEmptyTriageState();
  }

  private createEmptyTriageState(): TriageState {
    return {
      disasterType: 'unknown',
      locationAndHazard: null,
      hasInjured: null,
      breathingOrConsciousIssue: null,
      isSafeNow: null,
      waterRising: null,
      wetElectricCables: null,
      gasSmell: null,
      thickSmoke: null,
      peopleCount: null,
      vulnerablePeople: null,
      canEvacuate: null,
      safeExitKnown: null,
    };
  }

  private safetyReminder(): string {
    return 'Safety reminder: human life comes first. If unsure, choose the safest option and call emergency services.';
  }

  private currentTimeLabel(): string {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private newAssistantMessage(text: string): ChatMessage {
    return { role: 'assistant', text, time: this.currentTimeLabel() };
  }

  private newUserMessage(text: string): ChatMessage {
    return { role: 'user', text, time: this.currentTimeLabel() };
  }
}
