import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class ExportExcelService {

  exportAsExcelFile(json: any[], excelFileName: string): void {
    // CORRECCIÓN: Se quitó ': XLSX.WorkSheet'
    const worksheet = XLSX.utils.json_to_sheet(json);

    // CORRECCIÓN: Se quitó ': XLSX.WorkBook'
    const workbook = {
      Sheets: { 'data': worksheet },
      SheetNames: ['data']
    };

    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });

    this.saveExcelFile(excelBuffer, excelFileName);
  }

  private saveExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    saveAs(data, `${fileName}.xlsx`);
  }
}
