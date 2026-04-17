import { usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

type ActionType = 'hide' | 'pin' | 'authorize';
type AuthStatus = 'pending' | 'approved' | 'rejected' | 'expired';

interface GovernanceRule {
    action_type: ActionType;
}

interface UiRules {
    [moduleName: string]: {
        [elementId: string]: GovernanceRule;
    };
}

interface GovernanceWrapperProps {
    /** Must match the `id` attribute on the governed DOM element. */
    elementId: string;
    /** Must match `module_name` in the governance rule. */
    moduleName: string;
    children: React.ReactNode;
    /**
     * Callback fired after the user passes the governance check (PIN or authorization).
     *
     * @example
     * <GovernanceWrapper elementId="delete-invoice" moduleName="Invoices" onAction={() => handleDelete(id)}>
     *   <Button variant="destructive">Delete</Button>
     * </GovernanceWrapper>
     */
    onAction?: () => void;
}

function getCsrfToken(): string {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

async function postJson(url: string, body: Record<string, unknown>) {
    return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': getCsrfToken() },
        body: JSON.stringify(body),
    });
}

function formatSeconds(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function GovernanceWrapper({ elementId, moduleName, children, onAction }: GovernanceWrapperProps) {
    const { props } = usePage<{ auth?: { ui_rules?: UiRules } }>();
    const rule = props.auth?.ui_rules?.[moduleName]?.[elementId];

    // ── PIN state ──────────────────────────────────────────────────────────────
    const [showPinModal, setShowPinModal]     = useState(false);
    const [pin, setPin]                       = useState('');
    const [pinError, setPinError]             = useState('');
    const [isPinChecking, setIsPinChecking]   = useState(false);
    const [attemptsLeft, setAttemptsLeft]     = useState<number | null>(null);
    const [pinLocked, setPinLocked]           = useState(false);

    // ── Authorization state ────────────────────────────────────────────────────
    const [showAuthModal, setShowAuthModal]   = useState(false);
    const [authStatus, setAuthStatus]         = useState<AuthStatus>('pending');
    const [countdown, setCountdown]           = useState(0);
    const pollRef                             = useRef<ReturnType<typeof setInterval> | null>(null);
    const countdownRef                        = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, []);

    if (!rule) return <>{children}</>;
    if (rule.action_type === 'hide') return null;

    // ── Click interception (capture phase — fires before child onClick) ────────
    function handleClick(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();

        if (rule!.action_type === 'pin') {
            setPin('');
            setPinError('');
            setShowPinModal(true);
        } else {
            startAuthRequest();
        }
    }

    // ── PIN flow ───────────────────────────────────────────────────────────────

    async function verifyPin() {
        if (!pin || pinLocked) return;
        setIsPinChecking(true);
        setPinError('');

        try {
            const res  = await postJson('/governance/check-pin', {
                element_identifier: elementId,
                module_name: moduleName,
                pin,
            });
            const data = (await res.json()) as { valid: boolean; locked: boolean; attempts_left: number | null };

            if (data.valid) {
                setShowPinModal(false);
                setAttemptsLeft(null);
                setPinLocked(false);
                onAction?.();
                return;
            }

            if (data.locked) {
                setPinLocked(true);
                setAttemptsLeft(0);
                setPinError('Too many incorrect attempts. Try again in 15 minutes.');
            } else {
                setAttemptsLeft(data.attempts_left);
                setPinError(
                    data.attempts_left === 1
                        ? 'Incorrect PIN. 1 attempt remaining.'
                        : `Incorrect PIN. ${data.attempts_left} attempts remaining.`,
                );
            }
        } catch {
            setPinError('Error verifying PIN. Please try again.');
        } finally {
            setIsPinChecking(false);
        }
    }

    function closePinModal() {
        if (isPinChecking) return;
        setShowPinModal(false);
        setAttemptsLeft(null);
        setPinLocked(false);
        setPinError('');
    }

    // ── Authorization flow ─────────────────────────────────────────────────────

    async function startAuthRequest() {
        setAuthStatus('pending');
        setShowAuthModal(true);
        setCountdown(0);

        try {
            const res  = await postJson('/governance/request-authorization', {
                element_identifier: elementId,
                module_name: moduleName,
            });
            const data = (await res.json()) as { token: string; expires_at: string };

            const expiresAt   = new Date(data.expires_at).getTime();
            const totalSecs   = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
            setCountdown(totalSecs);

            startCountdown(expiresAt);
            startPolling(data.token);
        } catch {
            setShowAuthModal(false);
        }
    }

    function startCountdown(expiresAt: number) {
        if (countdownRef.current) clearInterval(countdownRef.current);

        countdownRef.current = setInterval(() => {
            const remaining = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
            setCountdown(remaining);

            if (remaining === 0) {
                clearInterval(countdownRef.current!);
                countdownRef.current = null;
            }
        }, 1000);
    }

    function startPolling(token: string) {
        if (pollRef.current) clearInterval(pollRef.current);

        pollRef.current = setInterval(async () => {
            try {
                const res  = await fetch(`/governance/check-authorization/${token}`);
                const data = (await res.json()) as { status: AuthStatus };

                if (data.status !== 'pending') {
                    clearInterval(pollRef.current!);
                    clearInterval(countdownRef.current!);
                    pollRef.current     = null;
                    countdownRef.current = null;
                    setAuthStatus(data.status);

                    if (data.status === 'approved') {
                        setTimeout(() => {
                            setShowAuthModal(false);
                            onAction?.();
                        }, 1200);
                    }
                }
            } catch {
                clearInterval(pollRef.current!);
                pollRef.current = null;
            }
        }, 2000);
    }

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <>
            {/*
             * onClickCapture fires in the capture phase — before the child's
             * own onClick — so we block the action until governance passes.
             */}
            <span className="contents" onClickCapture={handleClick}>
                {children}
            </span>

            {/* ── PIN Modal ────────────────────────────────────────────────── */}
            <Dialog open={showPinModal} onOpenChange={(open) => !open && closePinModal()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>PIN Required</DialogTitle>
                        <DialogDescription>This action is protected. Enter your PIN to continue.</DialogDescription>
                    </DialogHeader>

                    <div className="py-2">
                        <Input
                            type="password"
                            inputMode="numeric"
                            maxLength={10}
                            placeholder="Enter PIN"
                            value={pin}
                            disabled={pinLocked}
                            onChange={(e) => setPin(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && verifyPin()}
                            autoFocus
                        />

                        {pinError && (
                            <p className={`mt-1 text-sm ${pinLocked ? 'text-destructive font-medium' : 'text-destructive'}`}>
                                {pinError}
                            </p>
                        )}

                        {attemptsLeft !== null && !pinLocked && (
                            <p className="mt-1 text-xs text-muted-foreground">
                                {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining before lockout.
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={closePinModal} disabled={isPinChecking}>
                            Cancel
                        </Button>
                        <Button onClick={verifyPin} disabled={!pin || isPinChecking || pinLocked}>
                            {isPinChecking ? (
                                <><Spinner className="mr-1" /> Verifying…</>
                            ) : (
                                'Confirm'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Authorization Modal ──────────────────────────────────────── */}
            <Dialog
                open={showAuthModal}
                onOpenChange={(open) => { if (!open && authStatus !== 'pending') setShowAuthModal(false); }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {authStatus === 'pending'  && 'Waiting for Authorization'}
                            {authStatus === 'approved' && 'Authorization Approved'}
                            {authStatus === 'rejected' && 'Authorization Rejected'}
                            {authStatus === 'expired'  && 'Authorization Expired'}
                        </DialogTitle>
                        <DialogDescription>
                            {authStatus === 'pending'  && 'Your request has been sent to a supervisor. Please wait…'}
                            {authStatus === 'approved' && 'Your action has been authorized. Proceeding…'}
                            {authStatus === 'rejected' && 'A supervisor rejected your request.'}
                            {authStatus === 'expired'  && 'No supervisor responded in time. Please try again.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col items-center gap-3 py-4">
                        {authStatus === 'pending' && (
                            <>
                                <Spinner className="h-8 w-8 text-muted-foreground" />
                                {countdown > 0 && (
                                    <p className={`text-sm font-medium tabular-nums ${countdown <= 30 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                        Expires in {formatSeconds(countdown)}
                                    </p>
                                )}
                            </>
                        )}
                        {authStatus === 'approved' && (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-lg font-bold text-green-700 dark:bg-green-900 dark:text-green-300">
                                ✓
                            </div>
                        )}
                        {authStatus === 'rejected' && (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-lg font-bold text-red-700 dark:bg-red-900 dark:text-red-300">
                                ✗
                            </div>
                        )}
                        {authStatus === 'expired' && (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-lg font-bold text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                                ⏱
                            </div>
                        )}
                    </div>

                    {authStatus !== 'pending' && (
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowAuthModal(false)}>
                                Close
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
