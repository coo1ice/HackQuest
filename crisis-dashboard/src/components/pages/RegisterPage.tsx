import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { registerUser } from '../../api/endpoints';
import { Shield, Lock, User, MapPin, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import type { PageId } from '../../types/navigation';

interface RegisterPageProps {
  onRegisterSuccess?: (username: string) => void;
  onNavigate: (page: PageId) => void;
}

const ALL_STATES_OPTIONS = [
  { id: 'INAN', name: 'Andaman and Nicobar Islands' },
  { id: 'INAP', name: 'Andhra Pradesh' },
  { id: 'INAR', name: 'Arunachal Pradesh' },
  { id: 'INAS', name: 'Assam' },
  { id: 'INBR', name: 'Bihar' },
  { id: 'INCH', name: 'Chandigarh' },
  { id: 'INCT', name: 'Chhattisgarh' },
  { id: 'INDD', name: 'Daman and Diu' },
  { id: 'INDN', name: 'Dadra and Nagar Haveli' },
  { id: 'INDL', name: 'Delhi' },
  { id: 'INGA', name: 'Goa' },
  { id: 'INGJ', name: 'Gujarat' },
  { id: 'INHR', name: 'Haryana' },
  { id: 'INHP', name: 'Himachal Pradesh' },
  { id: 'INJK', name: 'Jammu and Kashmir' },
  { id: 'INJH', name: 'Jharkhand' },
  { id: 'INKA', name: 'Karnataka' },
  { id: 'INKL', name: 'Kerala' },
  { id: 'INLA', name: 'Ladakh' },
  { id: 'INLD', name: 'Lakshadweep' },
  { id: 'INMP', name: 'Madhya Pradesh' },
  { id: 'INMH', name: 'Maharashtra' },
  { id: 'INMN', name: 'Manipur' },
  { id: 'INML', name: 'Meghalaya' },
  { id: 'INMZ', name: 'Mizoram' },
  { id: 'INNL', name: 'Nagaland' },
  { id: 'INOR', name: 'Odisha' },
  { id: 'INPY', name: 'Puducherry' },
  { id: 'INPB', name: 'Punjab' },
  { id: 'INRJ', name: 'Rajasthan' },
  { id: 'INSK', name: 'Sikkim' },
  { id: 'INTN', name: 'Tamil Nadu' },
  { id: 'INTG', name: 'Telangana' },
  { id: 'INTR', name: 'Tripura' },
  { id: 'INUP', name: 'Uttar Pradesh' },
  { id: 'INUT', name: 'Uttarakhand' },
  { id: 'INWB', name: 'West Bengal' },
];

export const RegisterPage: React.FC<RegisterPageProps> = ({ onRegisterSuccess, onNavigate }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'national_admin' | 'state_officer' | 'district_officer' | 'phc_staff'>('state_officer');
  const [selectedState, setSelectedState] = useState('INMH');
  const [districtScope, setDistrictScope] = useState('Pune');
  const [phcScope, setPhcScope] = useState('PHC-MH-PUN-01');
  const [declarationAgreed, setDeclarationAgreed] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const getScopeId = () => {
    switch (role) {
      case 'national_admin':
        return 'IN';
      case 'state_officer':
        return selectedState;
      case 'district_officer':
        return districtScope.trim() || 'District';
      case 'phc_staff':
        return phcScope.trim() || 'PHC-FACILITY';
      default:
        return 'IN';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please provide both username and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters in length.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Access passwords do not match. Please verify.');
      return;
    }

    if (!declarationAgreed) {
      setErrorMessage('You must confirm the statutory official declaration to proceed.');
      return;
    }

    setIsLoading(true);
    const scope_id = getScopeId();

    try {
      await registerUser({
        username: username.trim(),
        password: password.trim(),
        role,
        scope_id,
      });

      setSuccessMessage(`Account '${username}' provisioned successfully under scope ${scope_id}. Initializing session...`);

      // Automatically sign in the newly registered officer
      try {
        await login(username.trim(), password.trim());
        setTimeout(() => {
          if (onRegisterSuccess) {
            onRegisterSuccess(username.trim());
          } else {
            onNavigate('national-overview');
          }
        }, 1000);
      } catch {
        // Fallback: direct to login page
        setTimeout(() => {
          onNavigate('login');
        }, 1500);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Registration failed. The username may already exist.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-6 px-4">
      <div className="bg-white border border-slate-300 shadow-sm p-6 sm:p-8">
        {/* Government Institutional Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-bold text-base">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-700 bg-slate-100 px-1.5 py-0.5 border border-slate-300">
                OFFICIAL ENROLLMENT
              </span>
              <span className="text-[10px] font-mono text-slate-500">MoHFW • FORM NIC-SEC-2026</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight mt-0.5">
              National Health Resource Management Platform
            </h1>
            <p className="text-xs text-slate-500">
              Officer Registration &amp; Operational Clearance Provisioning
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="my-4 bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700 leading-relaxed">
          Access is strictly reserved for authorized central, state, district, and primary health centre personnel. All issued credentials are tied to statutory surveillance mandates under the National Disaster Management Act, 2005.
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="mb-4 bg-red-50 border border-red-200 p-3 text-xs text-red-900 font-medium">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 bg-emerald-50 border border-emerald-300 p-3 text-xs text-emerald-900 font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reg-username" className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-600" />
              <span>Official Officer Username</span>
            </label>
            <input
              id="reg-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. officer_inmh or dr_deshmukh"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 focus:bg-white focus:outline-none focus:border-slate-800 transition-colors font-mono"
              required
            />
            <span className="text-[11px] text-slate-500">Letters, numbers, and underscores only.</span>
          </div>

          {/* Role Selection */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reg-role" className="text-xs font-bold text-slate-800">
              Operational Clearance Role
            </label>
            <select
              id="reg-role"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 focus:bg-white focus:outline-none focus:border-slate-800 font-medium text-slate-900"
            >
              <option value="state_officer">State Surveillance Officer (State Level Command)</option>
              <option value="national_admin">Central Command Administrator (All India Apex)</option>
              <option value="district_officer">District Health Officer (District Jurisdiction)</option>
              <option value="phc_staff">PHC Medical Officer (Facility Level)</option>
            </select>
          </div>

          {/* Scope Selection Based on Role */}
          {role === 'state_officer' && (
            <div className="flex flex-col gap-1.5 bg-slate-50 border border-slate-200 p-3">
              <label htmlFor="reg-state-scope" className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-600" />
                <span>State / UT Command Jurisdiction</span>
              </label>
              <select
                id="reg-state-scope"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 font-medium text-slate-900"
              >
                {ALL_STATES_OPTIONS.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.id} — {st.name}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-500 font-mono">
                Scope assigned: {selectedState} ({ALL_STATES_OPTIONS.find((s) => s.id === selectedState)?.name})
              </span>
            </div>
          )}

          {role === 'district_officer' && (
            <div className="flex flex-col gap-1.5 bg-slate-50 border border-slate-200 p-3">
              <label htmlFor="reg-district-scope" className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-600" />
                <span>District Jurisdiction Name</span>
              </label>
              <input
                id="reg-district-scope"
                type="text"
                value={districtScope}
                onChange={(e) => setDistrictScope(e.target.value)}
                placeholder="e.g. Muzaffarpur, Pune, Patna, Nagpur"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 font-mono"
                required
              />
            </div>
          )}

          {role === 'phc_staff' && (
            <div className="flex flex-col gap-1.5 bg-slate-50 border border-slate-200 p-3">
              <label htmlFor="reg-phc-scope" className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-600" />
                <span>Assigned Facility Code</span>
              </label>
              <input
                id="reg-phc-scope"
                type="text"
                value={phcScope}
                onChange={(e) => setPhcScope(e.target.value)}
                placeholder="e.g. PHC-BR-MUZ-01"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 font-mono"
                required
              />
            </div>
          )}

          {role === 'national_admin' && (
            <div className="bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700">
              <strong>National Central Command:</strong> Operational scope automatically assigned to <code className="font-mono bg-slate-200 px-1">IN</code> (Apex National Command).
            </div>
          )}

          {/* Passwords */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-password" className="text-xs font-bold text-slate-800">
                Access Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 focus:bg-white focus:outline-none focus:border-slate-800 transition-colors font-mono"
                  required
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-confirm-password" className="text-xs font-bold text-slate-800">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="reg-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 focus:bg-white focus:outline-none focus:border-slate-800 transition-colors font-mono"
                  required
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Statutory Declaration */}
          <div className="bg-slate-50 border border-slate-200 p-3">
            <label htmlFor="reg-declaration" className="flex items-start gap-2 cursor-pointer select-none">
              <input
                id="reg-declaration"
                name="declaration"
                type="checkbox"
                checked={declarationAgreed}
                onChange={(e) => setDeclarationAgreed(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
              />
              <span className="text-[11px] text-slate-700 leading-normal">
                I solemnly affirm that I am an authorized public health officer or official health system delegate of the Government of India or State/UT Health Department, and agree that all telemetry dispatches and directives executed under this account are recorded to an immutable national audit registry.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-black hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-xs flex items-center justify-center gap-2 mt-1"
          >
            {isLoading ? (
              <span>Provisioning Official Credential...</span>
            ) : (
              <>
                <span>Enroll Official Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Navigation Switchers */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="text-slate-700 hover:text-slate-950 font-medium flex items-center gap-1.5 cursor-pointer underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Already registered? Sign in to Command Terminal</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('national-overview')}
            className="text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            Proceed in Observer Mode &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
