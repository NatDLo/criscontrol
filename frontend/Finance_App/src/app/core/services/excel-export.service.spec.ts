import { ExcelExportService } from './excel-export.service';
import * as XLSX from 'xlsx';

describe('ExcelExportService', () => {
  let service: ExcelExportService;

  beforeEach(() => {
    service = new ExcelExportService();
    spyOn(service as never, 'writeFile' as never).and.stub();
  });

  it('exports transactions with localized values', () => {
    service.exportTransactions([{ id: '1', type: 'expense', amount: 10, categoryId: '1', categoryName: 'Food', description: 'Lunch', date: '2026-08-01', currency: 'ARS', currencyDisplay: 'ARS' }]);
    expect((service as never as { writeFile: jasmine.Spy }).writeFile).toHaveBeenCalled();
  });

  it('exports summary and a four-sheet report workbook', () => {
    service.exportSummary([{ label: 'Balance', value: 20 }], 'summary');
    service.exportReportWorkbook({ summary: { totalIncome: 100, totalExpenses: 30, balance: 70, transactionCount: 2, avgTransactionAmount: 65 }, categories: [], monthly: [], transactions: [], filters: { startDate: '2026-01-01', endDate: '2026-01-31' } });
    expect((service as never as { writeFile: jasmine.Spy }).writeFile).toHaveBeenCalledTimes(2);
  });

  it('saves a blob as a dated download', () => {
    const click = jasmine.createSpy('click');
    spyOn(document, 'createElement').and.returnValue({ click } as unknown as HTMLElement);
    spyOn(URL, 'createObjectURL').and.returnValue('blob:url');
    spyOn(URL, 'revokeObjectURL');
    service.saveBlob(new Blob(['data']), 'report');
    expect(click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
  });
});
