import React, { useState, useRef, useCallback } from 'react';
import type { PageId } from '../../types/navigation';
import { uploadPHCTelemetryFile } from '../../api/endpoints';
import type { BulkUploadResponse } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { SHOWCASE_DATASETS, createShowcaseFile } from '../../samples/showcaseCSVs';
import type { ShowcaseDataset } from '../../samples/showcaseCSVs';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  FileDown,
  ArrowRight,
  Database,
  RefreshCw,
  Layers,
  ShieldCheck,
  ShieldAlert,
  Globe2,
  FileText,
  Lock,
} from 'lucide-react';

interface DataIngestionPageProps {
  onNavigate: (page: PageId, options?: { stateId?: string; districtName?: string }) => void;
}

type TelemetryCategory = 'auto' | 'stock' | 'beds' | 'staff' | 'footfall';

export const DataIngestionPage: React.FC<DataIngestionPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [category, setCategory] = useState<TelemetryCategory>('auto');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeShowcaseId, setActiveShowcaseId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Inspection & validation state ("Check it")
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<BulkUploadResponse | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Ingestion state ("Allow it")
  const [isCommitting, setIsCommitting] = useState<boolean>(false);
  const [commitSuccess, setCommitSuccess] = useState<BulkUploadResponse | null>(null);
  const [commitError, setCommitError] = useState<string | null>(null);

  // Perform "Check It" validation
  const validateFile = useCallback(async (file: File, selectedCat: string) => {
    setIsValidating(true);
    setValidationError(null);
    setValidationResult(null);
    setCommitSuccess(null);
    setCommitError(null);

    try {
      const result = await uploadPHCTelemetryFile({
        file,
        category: selectedCat === 'auto' ? undefined : selectedCat,
        dry_run: true, // "Check it" inspection mode
      });
      setValidationResult(result);
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to parse and validate spreadsheet file.');
    } finally {
      setIsValidating(false);
    }
  }, []);

  const handleFileSelect = (file: File, showcaseId?: string) => {
    setSelectedFile(file);
    if (showcaseId) {
      setActiveShowcaseId(showcaseId);
    } else {
      setActiveShowcaseId(null);
    }
    validateFile(file, category);
  };

  // Quick load showcase dataset
  const handleLoadShowcase = (dataset: ShowcaseDataset) => {
    const file = createShowcaseFile(dataset);
    handleFileSelect(file, dataset.id);
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Authorize and commit ("Allow it")
  const handleCommitIngestion = async () => {
    if (!selectedFile) return;

    setIsCommitting(true);
    setCommitError(null);

    try {
      const result = await uploadPHCTelemetryFile({
        file: selectedFile,
        category: category === 'auto' ? undefined : category,
        dry_run: false, // "Allow it" database commit mode!
      });
      setCommitSuccess(result);
      setValidationResult(null);
      setSelectedFile(null);
      setActiveShowcaseId(null);
    } catch (err: any) {
      setCommitError(err?.message || 'Database ingestion failed. Please verify administrative clearance.');
    } finally {
      setIsCommitting(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setActiveShowcaseId(null);
    setValidationResult(null);
    setValidationError(null);
    setCommitSuccess(null);
    setCommitError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Jurisdiction descriptions
  const isNationalAdmin = user?.role === 'national_admin';
  const isStateOfficer = user?.role === 'state_officer';
  const isDistrictOfficer = user?.role === 'district_officer';

  return (
    <div className="flex flex-col w-full gap-5 pb-16">
      {/* Header Banner */}
      <div className="bg-white border border-slate-300 p-5 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-700 font-bold">
              Edge Telemetry Ingestion Hub
            </span>
            <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-slate-700 font-mono text-[10px]">
              AUDIT PROTOCOL: NDMA-SEC-38
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            PHC Data Ingestion (CSV / Excel)
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            Drag and drop field spreadsheets to validate (&quot;Check it&quot;) and reconcile (&quot;Allow it&quot;) medicine inventory,
            bed occupancy, and staffing into the national health ledger.
          </p>
        </div>

        {/* User RBAC Clearance Badge */}
        <div className="flex flex-col items-start lg:items-end gap-1.5">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
            Active Security Clearance
          </div>
          {isNationalAdmin && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-3 py-1 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <Globe2 className="w-4 h-4 text-emerald-600" />
              <span>ALL-INDIA CLEARANCE (Unrestricted National Upload)</span>
            </div>
          )}
          {isStateOfficer && (
            <div className="bg-blue-50 border border-blue-300 text-blue-900 px-3 py-1 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>STATE JURISDICTION: {user?.scope_id} (State-Restricted Ingestion)</span>
            </div>
          )}
          {isDistrictOfficer && (
            <div className="bg-purple-50 border border-purple-300 text-purple-900 px-3 py-1 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>DISTRICT JURISDICTION: {user?.scope_id} (District-Restricted Ingestion)</span>
            </div>
          )}
          {!isNationalAdmin && !isStateOfficer && !isDistrictOfficer && (
            <div className="bg-slate-100 border border-slate-300 text-slate-800 px-3 py-1 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <Lock className="w-4 h-4 text-slate-600" />
              <span>FACILITY SCOPE: {user?.scope_id || 'Restricted'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Showcase Datasets Card (For Instant Testing of Jurisdiction Enforcement) */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 border border-slate-700 shadow-md flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-bold tracking-wide uppercase">
              Showcase Telemetry Datasets (One-Click Jurisdiction Testing)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-300">
            Files stored locally in <code className="bg-slate-800 px-1.5 py-0.5 text-sky-300">frontend/public/samples/</code>
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Test statutory jurisdiction enforcement under NDMA Protocol Sec 38. Click any sample below to immediately parse and validate rows:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pt-1">
          {SHOWCASE_DATASETS.map((ds) => {
            const isSelected = activeShowcaseId === ds.id;
            return (
              <div
                key={ds.id}
                className={`bg-slate-800/90 border p-3 flex flex-col justify-between gap-2 transition-all ${
                  isSelected
                    ? 'border-sky-400 ring-2 ring-sky-400/30 bg-slate-800'
                    : 'border-slate-700 hover:border-slate-500'
                }`}
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 ${
                        ds.badge.variant === 'success'
                          ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700'
                          : ds.badge.variant === 'warning'
                          ? 'bg-amber-900/80 text-amber-200 border border-amber-600'
                          : ds.badge.variant === 'purple'
                          ? 'bg-purple-900/80 text-purple-200 border border-purple-700'
                          : 'bg-blue-900/80 text-blue-200 border border-blue-700'
                      }`}
                    >
                      {ds.badge.label}
                    </span>
                    <a
                      href={`/samples/${ds.filename}`}
                      download={ds.filename}
                      className="text-[10px] text-slate-400 hover:text-sky-300 flex items-center gap-1 font-mono transition-colors"
                      title="Download raw CSV file to desktop"
                    >
                      <FileDown className="w-3 h-3" />
                      <span>CSV</span>
                    </a>
                  </div>

                  <h4 className="text-xs font-bold text-white tracking-tight">{ds.name}</h4>
                  <p className="text-[11px] text-slate-300 leading-snug">{ds.description}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 mt-1">
                  <span className="text-[10px] font-mono text-slate-400">
                    Scope: <strong className="text-slate-200">{ds.authorizedScope}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleLoadShowcase(ds)}
                    className={`px-2.5 py-1 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-sky-500 text-slate-950 font-extrabold shadow-sm'
                        : 'bg-slate-700 hover:bg-slate-600 text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{isSelected ? 'Loaded in Check' : 'Load Sample'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Success Banner if committed */}
      {commitSuccess && (
        <div className="bg-emerald-50 border-2 border-emerald-600 p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-700 shrink-0" />
            <div>
              <h3 className="text-base font-bold text-emerald-900">
                Telemetry Successfully Authorized &amp; Ingested!
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                <strong>{commitSuccess.committed_records_count}</strong> {commitSuccess.category} records were verified and committed into the PostgreSQL operational registry.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-900 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              Upload Another Spreadsheet
            </button>
            <button
              type="button"
              onClick={() => onNavigate('state-district-drill-down')}
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View Drill-Down</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Ingestion Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Dropzone & Category Control */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {/* Category Selector Card */}
          <div className="bg-white border border-slate-300 p-4 shadow-sm flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-secondary" />
              <span>1. Telemetry Domain</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'auto', label: 'Auto-Detect' },
                { id: 'stock', label: 'Medicine Stock' },
                { id: 'beds', label: 'Bed Capacity' },
                { id: 'staff', label: 'Staff Attendance' },
                { id: 'footfall', label: 'OPD Footfall' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCategory(c.id as TelemetryCategory);
                    if (selectedFile) validateFile(selectedFile, c.id);
                  }}
                  className={`p-2 font-medium border text-left transition-colors cursor-pointer ${
                    category === c.id
                      ? 'bg-secondary text-white border-secondary font-bold shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed p-6 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-secondary bg-sky-50/70 scale-[1.01]'
                : selectedFile
                ? 'border-emerald-500 bg-emerald-50/30'
                : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
              <UploadCloud className="w-6 h-6 text-secondary" />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-slate-900">
                {selectedFile ? selectedFile.name : 'Drag & Drop CSV or Excel Spreadsheet'}
              </span>
              <span className="text-xs text-slate-500">
                Supports .CSV, .XLSX, and .XLS files (up to 15MB)
              </span>
            </div>

            {selectedFile && (
              <div className="flex items-center gap-2 text-xs font-mono bg-white border border-slate-200 px-2.5 py-1 text-slate-700">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                <span>•</span>
                <span className="text-emerald-700 font-bold uppercase">{selectedFile.name.split('.').pop()}</span>
              </div>
            )}

            <button
              type="button"
              className="mt-1 px-4 py-1.5 bg-black hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-colors"
            >
              Browse Local Files
            </button>
          </div>

          {/* Statutory Jurisdiction Isolation Rule Box */}
          <div className="bg-slate-50 border border-slate-300 p-4 text-xs flex flex-col gap-2 text-slate-700 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-secondary shrink-0" />
              <span>Statutory Rule: NDMA Protocol Sec 38</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              {isNationalAdmin && (
                <>
                  As an <strong>All-India National Admin</strong>, you are cleared to upload spreadsheets containing facilities across any state or district in India.
                </>
              )}
              {isStateOfficer && (
                <>
                  You are registered as State Officer for <strong>{user?.scope_id}</strong>. You may <strong>ONLY</strong> upload telemetry for facilities situated within {user?.scope_id}. Rows belonging to other states will trigger a statutory security violation and prevent database commit.
                </>
              )}
              {isDistrictOfficer && (
                <>
                  You are registered as District Officer for <strong>{user?.scope_id}</strong>. You may <strong>ONLY</strong> upload telemetry for facilities situated within {user?.scope_id} district.
                </>
              )}
              {!isNationalAdmin && !isStateOfficer && !isDistrictOfficer && (
                <>
                  You may only ingest data for your designated facility (<strong>{user?.scope_id}</strong>).
                </>
              )}
            </p>
          </div>
        </div>

        {/* Right Column: "Check It" Inspection & "Allow It" Authorization */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {isValidating ? (
            <div className="bg-white border border-slate-300 p-12 flex flex-col items-center justify-center gap-3 text-center shadow-sm">
              <RefreshCw className="w-8 h-8 text-secondary animate-spin" />
              <div className="text-sm font-bold text-slate-900">Checking &amp; Validating Telemetry...</div>
              <div className="text-xs text-slate-500 font-mono">Parsing rows, verifying PHC IDs, and validating schema metrics...</div>
            </div>
          ) : validationError ? (
            <div className="bg-red-50 border border-red-300 p-5 flex flex-col gap-2 text-error">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Spreadsheet Validation Error</span>
              </div>
              <p className="text-xs">{validationError}</p>
              <button
                type="button"
                onClick={handleReset}
                className="self-start mt-2 px-3 py-1 bg-red-800 text-white text-xs font-semibold cursor-pointer"
              >
                Try Another File
              </button>
            </div>
          ) : validationResult ? (
            <div className="flex flex-col gap-4">
              {/* Security Violation Alert Banner */}
              {validationResult.has_security_violations && (
                <div className="bg-red-50 border-2 border-red-600 p-4 shadow-sm flex flex-col sm:flex-row items-start gap-3">
                  <ShieldAlert className="w-6 h-6 text-red-700 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1">
                    <h4 className="text-sm font-bold text-red-900">
                      STATUTORY JURISDICTION VIOLATION DETECTED ({validationResult.security_violations_count} Rows Non-Compliant)
                    </h4>
                    <p className="text-xs text-red-800 leading-relaxed">
                      This spreadsheet contains health facilities outside your statutory jurisdiction (<strong>{user?.scope_id}</strong>).
                      Under NDMA Regulation Sec 38, State and District officers can only upload telemetry for facilities within their assigned territory.
                      <strong> Database commitment is blocked</strong> until unauthorized rows are removed or uploaded by an All-India National Administrator.
                    </p>
                  </div>
                </div>
              )}

              {/* Inspection KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-slate-300 p-3 shadow-2xs">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold block">Total Rows</span>
                  <span className="text-xl font-bold font-mono text-slate-900">{validationResult.total_rows}</span>
                </div>
                <div className="bg-white border border-emerald-300 p-3 shadow-2xs bg-emerald-50/20">
                  <span className="text-[10px] font-mono text-emerald-700 uppercase font-semibold block">Valid Records</span>
                  <span className="text-xl font-bold font-mono text-emerald-800">{validationResult.valid_rows_count}</span>
                </div>
                <div className={`p-3 border shadow-2xs ${validationResult.flagged_rows_count > 0 ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-300'}`}>
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold block">Flagged / Errors</span>
                  <span className={`text-xl font-bold font-mono ${validationResult.flagged_rows_count > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
                    {validationResult.flagged_rows_count}
                  </span>
                </div>
                <div className="bg-white border border-slate-300 p-3 shadow-2xs">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold block">Domain Category</span>
                  <span className="text-sm font-bold font-mono uppercase text-secondary">{validationResult.category}</span>
                </div>
              </div>

              {/* Data Table Preview ("Check It") */}
              <div className="bg-white border border-slate-300 shadow-sm overflow-hidden flex flex-col">
                <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-slate-700" />
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-900">
                      Telemetry Inspection Preview ({validationResult.preview_rows.length} of {validationResult.total_rows} Rows)
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-slate-600">
                    {validationResult.valid_rows_count} Compliant • {validationResult.flagged_rows_count} Flagged
                  </span>
                </div>

                <div className="w-full overflow-x-auto max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs divide-y divide-slate-200">
                    <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] font-semibold sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Row #</th>
                        <th className="py-2 px-3">PHC Facility</th>
                        {validationResult.category === 'stock' && (
                          <>
                            <th className="py-2 px-3">Medicine ID</th>
                            <th className="py-2 px-3">Quantity</th>
                            <th className="py-2 px-3">Expiry Date</th>
                          </>
                        )}
                        {validationResult.category === 'beds' && (
                          <>
                            <th className="py-2 px-3">Total Beds</th>
                            <th className="py-2 px-3">Occupied</th>
                            <th className="py-2 px-3">Occupancy %</th>
                          </>
                        )}
                        {validationResult.category === 'staff' && (
                          <>
                            <th className="py-2 px-3">Staff ID</th>
                            <th className="py-2 px-3">Role</th>
                            <th className="py-2 px-3">Status</th>
                          </>
                        )}
                        {validationResult.category === 'footfall' && (
                          <>
                            <th className="py-2 px-3">Department</th>
                            <th className="py-2 px-3">Patient Count</th>
                          </>
                        )}
                        <th className="py-2 px-3 text-right">Validation Check</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-xs">
                      {validationResult.preview_rows.map((row, idx) => {
                        const isSecurityAlert = row.errors?.some((e: string) => e.includes('Security Alert'));
                        return (
                          <tr
                            key={idx}
                            className={
                              isSecurityAlert
                                ? 'bg-red-50 hover:bg-red-100/60'
                                : row.valid
                                ? 'hover:bg-slate-50'
                                : 'bg-amber-50/50 hover:bg-amber-50'
                            }
                          >
                            <td className="py-2 px-3 text-slate-500">{row.row}</td>
                            <td className="py-2 px-3 font-semibold text-slate-900">{row.phc_id || 'MISSING'}</td>
                            {validationResult.category === 'stock' && (
                              <>
                                <td className="py-2 px-3 text-secondary font-bold">{row.medicine_id}</td>
                                <td className="py-2 px-3">
                                  {row.quantity} {row.unit}
                                </td>
                                <td className="py-2 px-3 text-slate-600">{row.expiry_date}</td>
                              </>
                            )}
                            {validationResult.category === 'beds' && (
                              <>
                                <td className="py-2 px-3">{row.total_beds}</td>
                                <td className="py-2 px-3 font-bold text-slate-900">{row.occupied_beds}</td>
                                <td className="py-2 px-3 text-secondary">{row.occupancy_rate}</td>
                              </>
                            )}
                            {validationResult.category === 'staff' && (
                              <>
                                <td className="py-2 px-3">{row.staff_id}</td>
                                <td className="py-2 px-3">{row.role}</td>
                                <td className="py-2 px-3 font-bold uppercase">{row.status}</td>
                              </>
                            )}
                            {validationResult.category === 'footfall' && (
                              <>
                                <td className="py-2 px-3">{row.department}</td>
                                <td className="py-2 px-3 font-bold">{row.patient_count}</td>
                              </>
                            )}
                            <td className="py-2 px-3 text-right font-sans">
                              {row.valid ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>VALID</span>
                                </span>
                              ) : isSecurityAlert ? (
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-red-900 bg-red-100 px-2 py-0.5 border border-red-300"
                                  title={row.errors?.join(', ')}
                                >
                                  <ShieldAlert className="w-3 h-3 text-red-700" />
                                  <span>SECURITY VIOLATION</span>
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 border border-amber-200"
                                  title={row.errors?.join(', ')}
                                >
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>{row.errors?.[0] || 'ERROR'}</span>
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

              {/* "Allow It" Authorization Action Strip */}
              <div className="bg-white border border-slate-300 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Discard &amp; Reset
                  </button>
                  <span className="text-xs text-slate-500">
                    {validationResult.valid_rows_count} records ready for statutory authorization.
                  </span>
                </div>

                <button
                  type="button"
                  disabled={
                    isCommitting ||
                    validationResult.valid_rows_count === 0 ||
                    validationResult.has_security_violations
                  }
                  onClick={handleCommitIngestion}
                  className={`w-full sm:w-auto px-5 py-2 text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm ${
                    validationResult.has_security_violations
                      ? 'bg-slate-300 text-slate-500 border border-slate-400 cursor-not-allowed'
                      : 'bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white cursor-pointer'
                  }`}
                  title={
                    validationResult.has_security_violations
                      ? 'Blocked: Remove cross-jurisdiction records before committing to the national registry'
                      : undefined
                  }
                >
                  {isCommitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Ingesting &amp; Reconciling...</span>
                    </>
                  ) : validationResult.has_security_violations ? (
                    <>
                      <ShieldAlert className="w-4 h-4 text-red-600" />
                      <span>Commit Blocked • Jurisdiction Policy</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Allow It • Ingest {validationResult.valid_rows_count} Records</span>
                    </>
                  )}
                </button>
              </div>

              {commitError && (
                <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{commitError}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-300 p-12 flex flex-col items-center justify-center gap-3 text-center shadow-sm">
              <FileSpreadsheet className="w-12 h-12 text-slate-300" />
              <div className="text-sm font-bold text-slate-900">Awaiting Spreadsheet File</div>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                Select one of the showcase datasets above or drop your field CSV to initiate the two-step verification (&quot;Check it&quot; preview, then &quot;Allow it&quot; ingestion).
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
