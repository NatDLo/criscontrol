import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CategoryService } from './category.service';
import { environment } from '../../../environments/environment';

describe('CategoryService', () => {
  let service: CategoryService;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}categories/`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CategoryService, provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CategoryService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads all categories and maps backend values', () => {
    service.getAll().subscribe((result) => {
      expect(result.success).toBeTrue();
      expect(result.data[0]).toEqual(jasmine.objectContaining({ id: '1', type: 'income', description: '', icon: 'category' }));
    });
    const request = http.expectOne(base);
    expect(request.request.method).toBe('GET');
    request.flush([{ id: 1, name: 'Salary', description: null, cat_type: 'INCOME', icon: null, color: null }]);
  });

  it('filters categories by type', () => {
    service.getAll('expense').subscribe();
    const request = http.expectOne((r) => r.url === base);
    expect(request.request.params.get('cat_type')).toBe('EXPENSE');
    request.flush([]);
  });

  it('creates, updates, and removes categories', () => {
    const item = { id: 2, name: 'Food', description: '', cat_type: 'EXPENSE' as const, icon: 'restaurant', color: '#fff' };
    service.create({ name: ' Food ', type: 'expense' }).subscribe((r) => expect(r.data.name).toBe('Food'));
    let request = http.expectOne(base);
    expect(request.request.body).toEqual(jasmine.objectContaining({ name: 'Food', cat_type: 'EXPENSE' }));
    request.flush(item);
    service.update('2', { name: 'Food', type: 'expense' }).subscribe((r) => expect(r.message).toBe('Categoría actualizada'));
    request = http.expectOne(`${base}2/`);
    request.flush(item);
    service.remove('2').subscribe((r) => expect(r.data).toBeUndefined());
    request = http.expectOne(`${base}2/`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});
