import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';

import { AnalyticsNavComponent } from '../../shared/components/analytics-nav/analytics-nav.component';
import { AlertService } from '../../modules/analytics/services/alert.service';
import {
  AlertRule, RuleExecutionResult, RuleField, RuleOperator, RuleAction, AlertSeverity,
} from '../../modules/analytics/models/alert.model';

@Component({
  selector: 'app-rule-engine',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, AnalyticsNavComponent],
  templateUrl: './rule-engine.component.html',
})
export class RuleEngineComponent implements OnInit {
  private svc = inject(AlertService);

  rules: AlertRule[] = [];
  results: RuleExecutionResult[] = [];
  loading = true;
  evaluating = false;
  showForm = false;

  fields: RuleField[] = ['TOTAL_REPORTS', 'HELP_REQUESTS', 'ACTIVE_RESPONDERS', 'AVG_RESPONSE_TIME'];
  operators: RuleOperator[] = ['GREATER_THAN', 'LESS_THAN', 'EQUALS', 'GREATER_OR_EQUAL', 'LESS_OR_EQUAL'];
  actions: RuleAction[] = ['CHANGE_SEVERITY', 'NOTIFY', 'AUTO_RESOLVE'];
  severities: AlertSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  operatorLabels: Record<string, string> = {
    GREATER_THAN: '>', LESS_THAN: '<', EQUALS: '=',
    GREATER_OR_EQUAL: '>=', LESS_OR_EQUAL: '<=',
  };

  newRule: AlertRule = {
    name: '', description: '', field: 'TOTAL_REPORTS',
    operator: 'GREATER_THAN', threshold: 0,
    action: 'CHANGE_SEVERITY', targetSeverity: 'CRITICAL', active: true,
  };

  ngOnInit(): void {
    this.loadRules();
  }

  loadRules(): void {
    this.svc.getRules().pipe(catchError(() => of([]))).subscribe((r) => {
      this.rules = r;
      this.loading = false;
    });
  }

  addRule(): void {
    this.svc.createRule(this.newRule).subscribe(() => {
      this.showForm = false;
      this.newRule = { name: '', description: '', field: 'TOTAL_REPORTS', operator: 'GREATER_THAN', threshold: 0, action: 'CHANGE_SEVERITY', targetSeverity: 'CRITICAL', active: true };
      this.loadRules();
    });
  }

  deleteRule(id: number): void {
    this.svc.deleteRule(id).subscribe(() => this.loadRules());
  }

  toggleRule(rule: AlertRule): void {
    rule.active = !rule.active;
    this.svc.updateRule(rule.id!, rule).subscribe(() => this.loadRules());
  }

  evaluate(): void {
    this.evaluating = true;
    this.svc.evaluateRules().pipe(catchError(() => of([]))).subscribe((r) => {
      this.results = r;
      this.evaluating = false;
      this.loadRules();
    });
  }
}
