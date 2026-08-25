import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>; let component: ConfirmDialogComponent; const ref = { close: jasmine.createSpy('close') };
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ConfirmDialogComponent], providers: [{ provide: MAT_DIALOG_DATA, useValue: { title: 'Title', message: 'Message' } }, { provide: MatDialogRef, useValue: ref }] }).compileComponents();
    fixture = TestBed.createComponent(ConfirmDialogComponent); component = fixture.componentInstance; fixture.detectChanges();
  });
  it('creates and closes with the selected result', () => { expect(component.data.title).toBe('Title'); component.confirm(); component.cancel(); expect(ref.close).toHaveBeenCalledWith(true); expect(ref.close).toHaveBeenCalledWith(false); });
});
