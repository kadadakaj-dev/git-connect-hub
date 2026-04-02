import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import ClientAuth from '../ClientAuth';

// Radix UI requires PointerEvent which JSDOM doesn't support
if (typeof globalThis.PointerEvent === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).PointerEvent = class PointerEvent extends MouseEvent {
        readonly pointerId: number;
        readonly pointerType: string;
        constructor(type: string, params: PointerEventInit & { pointerType?: string } = {}) {
            super(type, params);
            this.pointerId = params.pointerId ?? 0;
            this.pointerType = params.pointerType ?? '';
        }
    };
}

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        auth: {
            signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
            signUp: (...args: unknown[]) => mockSignUp(...args),
            getSession: () => mockGetSession(),
            onAuthStateChange: () => {
                mockOnAuthStateChange();
                return { data: { subscription: { unsubscribe: vi.fn() } } };
            },
        },
        from: () => ({ insert: vi.fn().mockResolvedValue({}) }),
    },
}));

vi.mock('@/i18n/LanguageContext', () => ({
    useLanguage: () => ({ language: 'sk' as const }),
}));

vi.mock('sonner', () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    },
}));

vi.mock('@/components/seo/PageMeta', () => ({
    default: () => null,
}));

vi.mock('@/components/GlassBackground', () => ({
    default: () => <div data-testid="glass-bg" />,
}));

vi.mock('@/components/LanguageSwitcher', () => ({
    default: () => <div data-testid="lang-switcher" />,
}));

describe('ClientAuth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetSession.mockResolvedValue({ data: { session: null } });
    });

    it('renders login and register tabs', () => {
        render(<ClientAuth />);
        expect(screen.getAllByText('Prihlásenie').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByRole('tab', { name: 'Registrácia' })).toBeInTheDocument();
    });

    describe('Email Sign-In', () => {
        it('signs in with valid email and password', async () => {
            mockSignInWithPassword.mockResolvedValue({ error: null });
            render(<ClientAuth />);

            fireEvent.change(screen.getByPlaceholderText('email@example.com'), { target: { value: 'test@test.com' } });
            fireEvent.change(screen.getByLabelText('Heslo'), { target: { value: 'password123' } });
            fireEvent.submit(screen.getByText('Prihlásiť sa').closest('form')!);

            await waitFor(() => {
                expect(mockSignInWithPassword).toHaveBeenCalledWith({
                    email: 'test@test.com',
                    password: 'password123',
                });
            });
        });

        it('shows validation error for invalid email', async () => {
            render(<ClientAuth />);

            fireEvent.change(screen.getByPlaceholderText('email@example.com'), { target: { value: 'invalid' } });
            fireEvent.change(screen.getByLabelText('Heslo'), { target: { value: 'password123' } });
            fireEvent.submit(screen.getByText('Prihlásiť sa').closest('form')!);

            await waitFor(() => {
                expect(screen.getByText('Neplatný email')).toBeInTheDocument();
            });
        });

        it('shows error toast for invalid credentials', async () => {
            const { toast } = await import('sonner');
            mockSignInWithPassword.mockResolvedValue({
                error: { message: 'Invalid login credentials' },
            });
            render(<ClientAuth />);

            fireEvent.change(screen.getByPlaceholderText('email@example.com'), { target: { value: 'test@test.com' } });
            fireEvent.change(screen.getByLabelText('Heslo'), { target: { value: 'wrongpass1' } });
            fireEvent.submit(screen.getByText('Prihlásiť sa').closest('form')!);

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Nesprávny email alebo heslo');
            });
        });
    });

    describe('Email Sign-Up', () => {
        async function switchToRegisterTab() {
            const tab = screen.getByRole('tab', { name: 'Registrácia' });
            fireEvent.pointerDown(tab, { button: 0, pointerType: 'mouse' });
            fireEvent.mouseDown(tab, { button: 0 });
            fireEvent.pointerUp(tab, { button: 0, pointerType: 'mouse' });
            fireEvent.mouseUp(tab, { button: 0 });
            fireEvent.click(tab, { button: 0 });
            await waitFor(() => {
                expect(screen.getByLabelText('Celé meno')).toBeInTheDocument();
            });
        }

        it('registers with valid data', async () => {
            mockSignUp.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
            render(<ClientAuth />);
            await switchToRegisterTab();

            fireEvent.change(screen.getByLabelText('Celé meno'), { target: { value: 'Ján Novák' } });
            fireEvent.change(screen.getByPlaceholderText('email@example.com'), { target: { value: 'jan@test.com' } });
            fireEvent.change(screen.getByLabelText('Heslo'), { target: { value: 'password123' } });
            fireEvent.submit(screen.getByText('Zaregistrovať sa').closest('form')!);

            await waitFor(() => {
                expect(mockSignUp).toHaveBeenCalledWith({
                    email: 'jan@test.com',
                    password: 'password123',
                    options: {
                        emailRedirectTo: expect.stringContaining('/portal'),
                        data: { full_name: 'Ján Novák', phone: '' },
                    },
                });
            });
        });

        it('shows validation error for short name', async () => {
            render(<ClientAuth />);
            await switchToRegisterTab();

            fireEvent.change(screen.getByLabelText('Celé meno'), { target: { value: 'J' } });
            fireEvent.change(screen.getByPlaceholderText('email@example.com'), { target: { value: 'jan@test.com' } });
            fireEvent.change(screen.getByLabelText('Heslo'), { target: { value: 'password123' } });
            fireEvent.submit(screen.getByText('Zaregistrovať sa').closest('form')!);

            await waitFor(() => {
                expect(screen.getByText('Meno musí mať aspoň 2 znaky')).toBeInTheDocument();
            });
        });

        it('shows error toast for already registered email', async () => {
            const { toast } = await import('sonner');
            mockSignUp.mockResolvedValue({
                data: { user: null },
                error: { message: 'User already registered' },
            });
            render(<ClientAuth />);
            await switchToRegisterTab();

            fireEvent.change(screen.getByLabelText('Celé meno'), { target: { value: 'Ján Novák' } });
            fireEvent.change(screen.getByPlaceholderText('email@example.com'), { target: { value: 'jan@test.com' } });
            fireEvent.change(screen.getByLabelText('Heslo'), { target: { value: 'password123' } });
            fireEvent.submit(screen.getByText('Zaregistrovať sa').closest('form')!);

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Email je už zaregistrovaný');
            });
        });

        it('shows success toast on successful registration', async () => {
            const { toast } = await import('sonner');
            mockSignUp.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
            render(<ClientAuth />);
            await switchToRegisterTab();

            fireEvent.change(screen.getByLabelText('Celé meno'), { target: { value: 'Ján Novák' } });
            fireEvent.change(screen.getByPlaceholderText('email@example.com'), { target: { value: 'jan@test.com' } });
            fireEvent.change(screen.getByLabelText('Heslo'), { target: { value: 'password123' } });
            fireEvent.submit(screen.getByText('Zaregistrovať sa').closest('form')!);

            await waitFor(() => {
                expect(toast.success).toHaveBeenCalledWith(
                    'Registrácia úspešná! Skontrolujte email pre overenie.',
                );
            });
        });
    });

    describe('Auth redirect', () => {
        it('redirects to /portal when session exists', async () => {
            mockGetSession.mockResolvedValue({
                data: { session: { user: { id: 'u1' } } },
            });
            render(<ClientAuth />);

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/portal');
            });
        });
    });
});
