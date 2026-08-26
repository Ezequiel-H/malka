/**
 * Punto de entrada del design system.
 *
 * Se importa siempre desde acá — `import { Button, Input } from '@/components/ui'` —
 * y nunca del archivo suelto. Así, mover o renombrar un componente por dentro
 * no obliga a tocar las pantallas que lo usan.
 */

export { default as cn } from './cn';

// Iconografía
export { default as Icon, iconNames, iconSizes } from './Icon';

// Formularios
export { default as Button, buttonVariants, buttonSizes } from './Button';
export { default as Field, useField } from './Field';
export { default as Input } from './Input';
export { default as Textarea } from './Textarea';
export { default as Select } from './Select';
export { default as Checkbox } from './Checkbox';
export { default as Radio, RadioGroup } from './Radio';
export { default as Switch } from './Switch';
export { default as FileInput } from './FileInput';
export { default as ColorInput } from './ColorInput';
export { default as DatePicker } from './DatePicker';
export { default as Calendar, DEFAULT_MONTHS } from './Calendar';
export { default as TimePicker } from './TimePicker';
export { computeAnchoredPosition } from './anchorPosition';

// Layout
export { default as Card, CardHeader } from './Card';
export { default as Table } from './Table';
export { default as Modal } from './Modal';
export { ConfirmProvider, useConfirm } from './ConfirmDialog';
export { default as ImageLightbox } from './ImageLightbox';

// Feedback
export { default as Badge, badgeTones } from './Badge';
export { default as Alert, alertTones } from './Alert';
export { Spinner, Skeleton, SkeletonText, SkeletonCards, SkeletonRows, EmptyState } from './Feedback';
