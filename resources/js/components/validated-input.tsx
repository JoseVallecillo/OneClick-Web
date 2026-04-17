import { forwardRef } from 'react';
import { usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';

// ── Validation types & rules ──────────────────────────────────────────────────

export type ValidationType = 'numeric' | 'alpha' | 'alpha-dash' | 'alphanumeric';

/**
 * Each RegExp tests a SINGLE character.
 * Used by keyboard interception and paste filtering.
 */
const CHAR_PATTERNS: Record<ValidationType, RegExp> = {
    numeric:        /^[0-9]$/,
    alpha:          /^[a-zA-Z\s]$/,
    'alpha-dash':   /^[a-zA-Z\s\-]$/,
    alphanumeric:   /^[a-zA-Z0-9]$/,
};

export const VALIDATION_HINTS: Record<ValidationType, string> = {
    numeric:        'Only digits (0-9)',
    alpha:          'Letters and spaces only',
    'alpha-dash':   'Letters, spaces and dashes',
    alphanumeric:   'Letters and numbers only',
};

// ── Shared Inertia types ──────────────────────────────────────────────────────

interface FieldValidatorRule {
    validation_type: ValidationType;
}

interface FieldValidators {
    [moduleName: string]: {
        [fieldId: string]: FieldValidatorRule;
    };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isAllowed(char: string, type: ValidationType): boolean {
    return CHAR_PATTERNS[type].test(char);
}

function filterText(text: string, type: ValidationType): string {
    return text.split('').filter((c) => isAllowed(c, type)).join('');
}

// ── Component props ───────────────────────────────────────────────────────────

export interface ValidatedInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    /**
     * Fallback validation type used when no rule is found in the database.
     * If omitted and no DB rule exists, the input behaves like a normal <Input>.
     */
    validationType?: ValidationType;
    /**
     * Field identifier — must match `field_identifier` in governance_field_validators.
     * Required when using database-driven validation via the Governance panel.
     */
    fieldId?: string;
    /**
     * Module name — must match `module_name` in governance_field_validators.
     * Required when using database-driven validation via the Governance panel.
     */
    moduleName?: string;
}

// ── ValidatedInput ────────────────────────────────────────────────────────────

/**
 * Drop-in replacement for `<Input>` with real-time character blocking.
 *
 * Validation type is resolved in this order:
 *   1. Database rule from Governance panel  (fieldId + moduleName)
 *   2. Inline `validationType` prop         (developer fallback)
 *   3. No validation                        (behaves as normal input)
 *
 * Compatible with Inertia's `useForm`:
 * ```tsx
 * // Controlled by Governance panel (admin configures via /governance)
 * <ValidatedInput
 *     fieldId="id-socio"
 *     moduleName="Socios"
 *     value={data.id_socio}
 *     onChange={(e) => setData('id_socio', e.target.value)}
 * />
 *
 * // Hardcoded fallback (no DB rule needed)
 * <ValidatedInput
 *     validationType="numeric"
 *     value={data.code}
 *     onChange={(e) => setData('code', e.target.value)}
 * />
 * ```
 */
const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
    (
        {
            validationType: validationTypeProp,
            fieldId,
            moduleName,
            onBeforeInput,
            onPaste,
            className,
            placeholder,
            ...props
        },
        ref,
    ) => {
        // ── Resolve validation type (DB first, then prop) ─────────────────────
        const { props: pageProps } = usePage<{
            auth?: { field_validators?: FieldValidators };
        }>();

        const dbRule =
            fieldId && moduleName
                ? pageProps.auth?.field_validators?.[moduleName]?.[fieldId]
                : undefined;

        const activeType: ValidationType | undefined =
            dbRule?.validation_type ?? validationTypeProp;

        // No validation rule — render plain input
        if (!activeType) {
            return (
                <input
                    ref={ref}
                    data-slot="input"
                    placeholder={placeholder}
                    className={cn(BASE_CLASSES, className)}
                    {...props}
                />
            );
        }

        // ── Event handlers ────────────────────────────────────────────────────

        function handleBeforeInput(e: React.FormEvent<HTMLInputElement>) {
            const chars = (e as InputEvent).data ?? '';
            if (chars && !chars.split('').every((c) => isAllowed(c, activeType!))) {
                e.preventDefault();
            }
            onBeforeInput?.(e);
        }

        function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
            e.preventDefault();
            const filtered = filterText(e.clipboardData.getData('text/plain'), activeType!);
            if (filtered) {
                document.execCommand('insertText', false, filtered);
            }
            onPaste?.(e);
        }

        return (
            <input
                ref={ref}
                data-slot="input"
                data-validation={activeType}
                data-field-id={fieldId}
                placeholder={placeholder ?? VALIDATION_HINTS[activeType]}
                onBeforeInput={handleBeforeInput}
                onPaste={handlePaste}
                className={cn(BASE_CLASSES, className)}
                {...props}
            />
        );
    },
);

ValidatedInput.displayName = 'ValidatedInput';

// ── Shared base classes (mirrors <Input> component) ───────────────────────────

const BASE_CLASSES = [
    'border-input file:text-foreground placeholder:text-muted-foreground',
    'selection:bg-primary selection:text-primary-foreground',
    'flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1',
    'text-base shadow-xs transition-[color,box-shadow] outline-none',
    'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
    'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
    'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
].join(' ');

export { ValidatedInput };
