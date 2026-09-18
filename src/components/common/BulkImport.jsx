import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import API from '../../api/axios';
import toast from 'react-hot-toast';

const TEMPLATE_HEADERS = [
  'Name', 'Description', 'Price', 'SalePrice', 'Stock',
  'Category', 'Subcategory', 'Colors', 'Tags', 'Images',
  'IsNew', 'IsTrending', 'IsFeatured', 'IsBestSeller', 'IsBridal',
];

const TEMPLATE_EXAMPLES = [
  {
    Name: 'Softyy Lemon Face Wash',
    Description: 'A refreshing daily cleanser for oil control.',
    Price: 350,
    SalePrice: '',
    Stock: 50,
    Category: 'Face Care',
    Subcategory: '',
    Colors: '',
    Tags: 'cleanser,oil-control,daily-care',
    Images: 'https://example.com/img1.jpg,https://example.com/img2.jpg',
    IsNew: 'true',
    IsTrending: 'false',
    IsFeatured: 'false',
    IsBestSeller: 'false',
    IsBridal: 'false',
  },
  {
    Name: 'Softyy Milk Soothing Gel',
    Description: 'Lightweight daily hydration for calm, comfortable skin.',
    Price: 480,
    SalePrice: '',
    Stock: 20,
    Category: 'Soothing Care',
    Subcategory: '',
    Colors: '',
    Tags: 'soothing,hydration,daily-care',
    Images: 'https://example.com/softyy-gel.jpg',
    IsNew: 'true',
    IsTrending: 'false',
    IsFeatured: 'false',
    IsBestSeller: 'false',
    IsBridal: 'false',
  },
];

function validateRow(row, idx) {
  const errors = [];
  if (!row.Name || !row.Name.trim()) errors.push('Name is required');
  if (!row.Price || Number(row.Price) <= 0) errors.push('Valid Price is required');
  if (row.SalePrice && Number(row.SalePrice) >= Number(row.Price)) errors.push('SalePrice must be less than Price');
  return errors;
}

export default function BulkImport({ onImportComplete }) {
  const [step, setStep] = useState('idle');
  const [parsedData, setParsedData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet(TEMPLATE_EXAMPLES, { header: TEMPLATE_HEADERS });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');

    ws['!cols'] = TEMPLATE_HEADERS.map((h) => ({ wch: Math.max(h.length + 2, 18) }));

    XLSX.writeFile(wb, 'softy_product_import_template.xlsx');
    toast.success('Template downloaded!');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!json.length) {
          toast.error('No data found in file');
          return;
        }

        const errors = [];
        json.forEach((row, idx) => {
          const rowErrors = validateRow(row, idx);
          if (rowErrors.length) errors.push({ row: idx + 2, errors: rowErrors });
        });

        setParsedData(json);
        setValidationErrors(errors);
        setStep('preview');
      } catch (err) {
        toast.error('Failed to parse file. Please use the template.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleImport = async () => {
    if (validationErrors.length) {
      toast.error('Fix all validation errors before importing');
      return;
    }
    try {
      setImporting(true);
      const res = await API.post('/admin/products/import', { products: parsedData });
      const data = res.data;
      setResult({ success: data.success, errors: data.errors || [] });
      setStep('result');
      if (data.success > 0) {
        toast.success(`${data.success} product(s) imported!`);
        onImportComplete?.();
      }
      if (data.errors?.length) {
        toast.error(`${data.errors.length} product(s) failed`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setStep('idle');
    setParsedData([]);
    setValidationErrors([]);
    setResult(null);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Bulk Import Products</h3>
          <p className="text-xs text-gray-500 mt-1">Import products from an Excel file (.xlsx)</p>
        </div>
        <button
          onClick={downloadTemplate}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download Template
        </button>
      </div>

      {step === 'idle' && (
        <div className="p-6">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-rose-400 transition-colors">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-sm text-gray-600 mb-2">Drop your Excel file here or click to browse</p>
            <p className="text-xs text-gray-400 mb-4">Supports .xlsx files. Download the template first for correct format.</p>
            <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 cursor-pointer transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Select Excel File
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Column Reference</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600">
              <div><span className="font-semibold text-gray-800">Name *</span> — Product name (required)</div>
              <div><span className="font-semibold text-gray-800">Description</span> — Product description</div>
              <div><span className="font-semibold text-gray-800">Price *</span> — Regular price (required)</div>
              <div><span className="font-semibold text-gray-800">SalePrice</span> — Sale price (leave empty if not on sale)</div>
              <div><span className="font-semibold text-gray-800">Stock</span> — Available stock quantity</div>
              <div><span className="font-semibold text-gray-800">Category</span> — Must match existing category name exactly</div>
              <div><span className="font-semibold text-gray-800">Subcategory</span> — Must match existing subcategory name exactly</div>
              <div><span className="font-semibold text-gray-800">Colors</span> — Comma-separated (e.g., Red,Blue,Green)</div>
              <div><span className="font-semibold text-gray-800">Tags</span> — Comma-separated (e.g., summer,bridal)</div>
              <div><span className="font-semibold text-gray-800">Images</span> — Comma-separated image URLs</div>
              <div><span className="font-semibold text-gray-800">IsNew</span> — true or false (default: true)</div>
              <div><span className="font-semibold text-gray-800">IsTrending</span> — true or false</div>
              <div><span className="font-semibold text-gray-800">IsFeatured</span> — true or false</div>
              <div><span className="font-semibold text-gray-800">IsBestSeller</span> — true or false</div>
              <div><span className="font-semibold text-gray-800">IsBridal</span> — true or false</div>
            </div>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {parsedData.length} product(s) found
              </p>
              {validationErrors.length > 0 && (
                <p className="text-xs text-rose-600 mt-1">
                  {validationErrors.length} row(s) have validation errors
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={reset}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importing || validationErrors.length > 0}
                className="px-5 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {importing ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Importing...
                  </span>
                ) : (
                  `Import ${parsedData.length} Product(s)`
                )}
              </button>
            </div>
          </div>

          {validationErrors.length > 0 && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg max-h-40 overflow-y-auto">
              <p className="text-xs font-bold text-rose-700 mb-2">Validation Errors:</p>
              {validationErrors.map((err, i) => (
                <p key={i} className="text-xs text-rose-600">
                  Row {err.row}: {err.errors.join('; ')}
                </p>
              ))}
            </div>
          )}

          <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">#</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Name</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Price</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">SalePrice</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Category</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Colors</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parsedData.map((row, idx) => {
                  const rowError = validationErrors.find(e => e.row === idx + 2);
                  return (
                    <tr key={idx} className={rowError ? 'bg-rose-50' : 'hover:bg-gray-50'}>
                      <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                      <td className="px-3 py-2 font-medium text-gray-900 max-w-[200px] truncate">{row.Name || '-'}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{row.Price || '-'}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{row.SalePrice || '-'}</td>
                      <td className="px-3 py-2 text-gray-700">{row.Category || '-'}</td>
                      <td className="px-3 py-2 text-gray-600">{row.Colors || '-'}</td>
                      <td className="px-3 py-2 text-center">
                        {rowError ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-100 text-rose-700">
                            Error
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700">
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {step === 'result' && result && (
        <div className="p-6">
          <div className="text-center mb-6">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${result.errors.length === 0 ? 'bg-emerald-100' : 'bg-amber-100'}`}>
              {result.errors.length === 0 ? (
                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              )}
            </div>
            <h3 className="text-lg font-bold text-gray-900">Import Complete</h3>
            <p className="text-sm text-gray-600 mt-1">
              {result.success} product(s) imported successfully
              {result.errors.length > 0 && ` • ${result.errors.length} failed`}
            </p>
          </div>

          {result.errors.length > 0 && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg max-h-48 overflow-y-auto">
              <p className="text-xs font-bold text-rose-700 mb-2">Failed Rows:</p>
              {result.errors.map((err, i) => (
                <p key={i} className="text-xs text-rose-600">
                  Row {err.row}: {err.error}
                </p>
              ))}
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={reset}
              className="px-6 py-2.5 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors"
            >
              Import More Products
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
