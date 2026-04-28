import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { concat, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { Skill, SkillsService } from '../../../core/services/skills.service';

interface ParsedSkillRow {
  rowNumber: number;
  name: string;
  category: string;
  description: string;
  isVerifiable: boolean;
  slug: string;
  parentSkillId?: number;
  errors: string[];
}

interface ImportFailure {
  rowName: string;
  reason: string;
}

@Component({
  selector: 'app-skill-import',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skill-import.component.html',
})
export class SkillImportComponent {
  parsedRows: ParsedSkillRow[] = [];
  fileName = '';
  isDragging = false;
  isImporting = false;
  importProgressCurrent = 0;
  importProgressTotal = 0;
  summaryMessage = '';
  importFailures: ImportFailure[] = [];
  errorMessage = '';

  constructor(
    private skillsService: SkillsService,
    private router: Router,
  ) {}

  get invalidRowsCount(): number {
    return this.parsedRows.filter((row) => row.errors.length > 0).length;
  }

  get validRows(): ParsedSkillRow[] {
    return this.parsedRows.filter((row) => row.errors.length === 0);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.processFile(file);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.processFile(file);
    input.value = '';
  }

  importValidRows(): void {
    if (this.validRows.length === 0 || this.isImporting) {
      return;
    }

    this.isImporting = true;
    this.errorMessage = '';
    this.summaryMessage = '';
    this.importFailures = [];
    this.importProgressCurrent = 0;
    this.importProgressTotal = this.validRows.length;

    const requests = this.validRows.map((row) =>
      this.skillsService.create(this.toSkillPayload(row)).pipe(
        map(() => ({ success: true, row, reason: '' })),
        catchError((error) =>
          of({
            success: false,
            row,
            reason: this.getErrorReason(error),
          }),
        ),
      ),
    );

    let successCount = 0;
    let failureCount = 0;

    concat(...requests).subscribe({
      next: (result) => {
        this.importProgressCurrent += 1;
        if (result.success) {
          successCount += 1;
          return;
        }

        failureCount += 1;
        this.importFailures.push({
          rowName: result.row.name || `Row ${result.row.rowNumber}`,
          reason: result.reason,
        });
      },
      complete: () => this.finishImport(successCount, failureCount),
    });
  }

  private processFile(file: File): void {
    this.resetImportState();

    if (!this.isSupportedFile(file.name)) {
      this.errorMessage = 'Only .csv and .xlsx files are supported.';
      return;
    }

    this.fileName = file.name;
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!(data instanceof ArrayBuffer)) {
          throw new Error('Could not read file content.');
        }

        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        if (!sheet) {
          throw new Error('No worksheet found in file.');
        }

        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
          defval: '',
        });
        this.parsedRows = rows.map((row, index) => this.parseRow(row, index + 2));
      } catch (error) {
        this.errorMessage =
          error instanceof Error ? error.message : 'Failed to parse uploaded file.';
      }
    };

    reader.onerror = () => {
      this.errorMessage = 'Failed to read file.';
    };

    reader.readAsArrayBuffer(file);
  }

  private parseRow(rawRow: Record<string, unknown>, rowNumber: number): ParsedSkillRow {
    const normalized = this.normalizeKeys(rawRow);
    const name = this.toText(normalized['name']);
    const category = this.toText(normalized['category']);
    const description = this.toText(normalized['description']);
    const isVerifiableValue = this.parseBoolean(normalized['isverifiable']);
    const parentSkill = this.parseOptionalNumber(normalized['parentskillid']);
    const errors: string[] = [];

    if (!name) {
      errors.push('Missing name');
    }
    if (!category) {
      errors.push('Missing category');
    }
    if (isVerifiableValue === null) {
      errors.push('Invalid isVerifiable value');
    }
    if (normalized['parentskillid'] !== '' && parentSkill === null) {
      errors.push('Invalid parentSkillId');
    }

    return {
      rowNumber,
      name,
      category,
      description,
      isVerifiable: isVerifiableValue ?? false,
      slug: this.createSlug(name),
      parentSkillId: parentSkill ?? undefined,
      errors,
    };
  }

  private normalizeKeys(row: Record<string, unknown>): Record<string, unknown> {
    return Object.keys(row).reduce<Record<string, unknown>>((acc, key) => {
      const normalizedKey = key.toLowerCase().replace(/\s|_/g, '');
      acc[normalizedKey] = row[key];
      return acc;
    }, {});
  }

  private createSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private parseBoolean(value: unknown): boolean | null {
    const normalized = this.toText(value).toLowerCase();
    if (!normalized) {
      return false;
    }
    if (['yes', 'true', '1'].includes(normalized)) {
      return true;
    }
    if (['no', 'false', '0'].includes(normalized)) {
      return false;
    }
    return null;
  }

  private parseOptionalNumber(value: unknown): number | null {
    const text = this.toText(value);
    if (!text) {
      return null;
    }
    const parsed = Number(text);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private toText(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value).trim();
  }

  private toSkillPayload(row: ParsedSkillRow): Skill {
    return {
      name: row.name,
      category: row.category,
      description: row.description || undefined,
      isVerifiable: row.isVerifiable,
      parentSkillId: row.parentSkillId,
      slug: row.slug,
      isActive: true,
    };
  }

  private getErrorReason(error: unknown): string {
    const apiMessage = (error as any)?.error?.message;
    const rootMessage = (error as any)?.message;
    return apiMessage || rootMessage || 'Unknown server error';
  }

  private finishImport(successCount: number, failureCount: number): void {
    this.isImporting = false;
    this.summaryMessage = `${successCount} imported successfully · ${failureCount} failed`;
    if (failureCount === 0) {
      setTimeout(() => this.router.navigate(['/skills']), 2000);
    }
  }

  private isSupportedFile(fileName: string): boolean {
    const lower = fileName.toLowerCase();
    return lower.endsWith('.csv') || lower.endsWith('.xlsx');
  }

  private resetImportState(): void {
    this.parsedRows = [];
    this.summaryMessage = '';
    this.importFailures = [];
    this.errorMessage = '';
    this.importProgressCurrent = 0;
    this.importProgressTotal = 0;
    this.isImporting = false;
  }
}
