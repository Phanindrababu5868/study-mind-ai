import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, selectAuthLoading } from '../../store/slices/authSlice';
import { isPasswordValid } from '../../utils/passwordValidation';
import PasswordChecklist from '../../components/auth/PasswordChecklist';
import ThemedSelect from '../../components/common/ThemedSelect';
import { BrainCircuit, Mail, Lock, ArrowRight, User, Calendar, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';

// Values must match the AGE_RANGES enum in backend/models/User.js.
const AGE_RANGE_OPTIONS = [
  { value: 'under_18', label: 'Under 18' },
  { value: '18_24', label: '18 - 24' },
  { value: '25_34', label: '25 - 34' },
  { value: '35_44', label: '35 - 44' },
  { value: '45_54', label: '45 - 54' },
  { value: '55_plus', label: '55 or older' },
];

const OCCUPATION_OPTIONS = [
  'Student (School)',
  'Student (University)',
  'Teacher / Educator',
  'Software Engineer',
  'Healthcare Professional',
  'Researcher / Academic',
  'Business / Finance',
  'Designer / Creative',
  'Other',
].map((label) => ({ value: label, label }));

const inputClass =
  'w-full h-12 pl-12 pr-4 border-2 border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 text-sm font-medium transition-all duration-200 focus:outline-none focus:border-emerald-500 focus:bg-white focus:shadow-lg focus:shadow-emerald-500/10';

const RegisterPage = () => {
  // Single form object rather than six useState calls — keeps the change
  // handler generic and avoids a wall of setters.
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    ageRange: '',
    occupation: '',
  });
  const [error, setError] = useState('');
  const [touchedConfirm, setTouchedConfirm] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const loading = useSelector(selectAuthLoading);

  const setField = (name) => (e) =>
    setForm((prev) => ({ ...prev, [name]: e.target.value }));

  // react-select hands back the whole { value, label } option (or null on
  // clear) rather than a change event, so it gets its own setter.
  const setSelectField = (name) => (option) =>
    setForm((prev) => ({ ...prev, [name]: option?.value || '' }));

  const passwordValid = useMemo(() => isPasswordValid(form.password), [form.password]);
  const passwordsMatch =
    form.confirmPassword.length > 0 && form.password === form.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.ageRange || !form.occupation) {
      setError('Please select your age range and occupation.');
      return;
    }
    if (!passwordValid) {
      setError('Please meet all password requirements below.');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    try {
      const { confirmPassword, ...payload } = form;
      // Registration now logs the user straight in (the server sets the auth
      // cookies on the register response), so we go to the dashboard rather
      // than bouncing them to /login to type their password again.
      await dispatch(register(payload)).unwrap();
      toast.success('Welcome to StudyMind AI!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message = typeof err === 'string' ? err : 'Failed to register. Please try again.';
      setError(message);
      toast.error(message);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen py-10 bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-[size:16px_16px] opacity-30" />

      <div className="relative w-full max-w-md px-6">
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-xl shadow-slate-200/50 p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/25 mb-0">
              <BrainCircuit className="w-7 h-7 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-medium text-slate-900 tracking-tight mb-2">
              Create your account
            </h1>
            <p className="text-slate-500 text-sm">
              Start your AI-powered learning experience
            </p>
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={form.username}
                  onChange={setField('username')}
                  required
                  minLength={3}
                  className={inputClass}
                  placeholder="janedoe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={setField('email')}
                  required
                  className={inputClass}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Age range + occupation feed the AI prompt context so generated
                flashcards, quizzes and explanations match the learner. */}
            <div>
              <label htmlFor="ageRange" className="block text-sm font-medium text-slate-700 mb-1">
                Age range
              </label>
              <ThemedSelect
                inputId="ageRange"
                icon={Calendar}
                options={AGE_RANGE_OPTIONS}
                value={AGE_RANGE_OPTIONS.find((opt) => opt.value === form.ageRange) || null}
                onChange={setSelectField('ageRange')}
                placeholder="Select your age range"
                isSearchable={false}
                invalid={!form.ageRange && Boolean(error)}
              />
            </div>

            <div>
              <label htmlFor="occupation" className="block text-sm font-medium text-slate-700 mb-1">
                Occupation
              </label>
              <ThemedSelect
                inputId="occupation"
                icon={Briefcase}
                options={OCCUPATION_OPTIONS}
                value={OCCUPATION_OPTIONS.find((opt) => opt.value === form.occupation) || null}
                onChange={setSelectField('occupation')}
                placeholder="Select your occupation"
                isSearchable={false}
                invalid={!form.occupation && Boolean(error)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={setField('password')}
                  required
                  className={inputClass}
                  placeholder="Create a strong password"
                />
              </div>
              <PasswordChecklist password={form.password} />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={setField('confirmPassword')}
                  onBlur={() => setTouchedConfirm(true)}
                  required
                  className={`${inputClass} ${
                    touchedConfirm && form.confirmPassword && !passwordsMatch
                      ? 'border-red-300'
                      : ''
                  }`}
                  placeholder="Re-enter your password"
                />
              </div>
              {touchedConfirm && form.confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-xs text-red-500">Passwords do not match.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 mt-2 py-2.5 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-medium shadow-lg shadow-emerald-500/25 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create account'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200/60">
            <p className="text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-emerald-500 hover:text-emerald-700 transition-colors duration-200">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          By continuing, you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
