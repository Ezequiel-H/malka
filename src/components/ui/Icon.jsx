import {
  AlertCircle,
  Baby,
  Bike,
  BookOpen,
  Cake,
  Camera,
  ChefHat,
  Clapperboard,
  Coffee,
  Crown,
  Drama,
  Dumbbell,
  Flame,
  Flower2,
  Gamepad2,
  Gift,
  Globe,
  GraduationCap,
  Guitar,
  HandHeart,
  Heart,
  Landmark,
  Languages,
  Leaf,
  Lightbulb,
  Mic,
  Moon,
  Mountain,
  Music,
  PartyPopper,
  PawPrint,
  Piano,
  Pizza,
  Plane,
  Puzzle,
  Rocket,
  Star,
  Sun,
  Tent,
  Trophy,
  Utensils,
  Waves,
  Wine,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Ban,
  Calendar,
  CalendarPlus,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Filter,
  Info,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Minus,
  Palette,
  Pencil,
  Phone,
  Plus,
  Search,
  Settings,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  User,
  Users,
  X,
} from 'lucide-react';

/**
 * Registro central de iconos.
 *
 * Los componentes piden iconos por nombre SEMÁNTICO (`delete`, `success`), no
 * por el nombre de la librería (`Trash2`, `CheckCircle2`). Dos motivos:
 *
 * 1. Cambiar de librería de iconos es reescribir este archivo y nada más.
 * 2. Un mismo concepto se dibuja siempre igual en toda la app — hoy "eliminar"
 *    aparece como 🗑, como una X y como la palabra "Borrar" según la pantalla.
 */
const ICONS = {
  // Acciones
  add: Plus,
  edit: Pencil,
  delete: Trash2,
  close: X,
  search: Search,
  filter: Filter,
  download: Download,
  upload: Upload,
  check: Check,
  copy: Copy,
  remove: Minus,
  view: Eye,
  hide: EyeOff,
  external: ExternalLink,

  // Navegación
  back: ArrowLeft,
  forward: ArrowRight,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  menu: Menu,
  dashboard: LayoutDashboard,
  logout: LogOut,
  settings: Settings,

  // Estado / feedback
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
  loading: Loader2,
  empty: Sparkles,
  sparkles: Sparkles,
  blocked: Ban,

  // Dominio de Malka
  activity: Calendar,
  addToCalendar: CalendarPlus,
  time: Clock,
  location: MapPin,
  user: User,
  users: Users,
  tag: Tag,
  payment: CreditCard,
  document: FileText,
  policy: FileText,
  whatsapp: MessageCircle,
  mail: Mail,
  phone: Phone,
  color: Palette,

  // Temáticos, para que cada tag pueda tener el suyo
  music: Music,
  food: Utensils,
  sport: Dumbbell,
  plane: Plane,
  heart: Heart,
  leaf: Leaf,
  star: Star,
  book: BookOpen,
  camera: Camera,
  flame: Flame,
  theater: Drama,
  film: Clapperboard,
  mic: Mic,
  guitar: Guitar,
  piano: Piano,
  coffee: Coffee,
  wine: Wine,
  chef: ChefHat,
  cake: Cake,
  pizza: Pizza,
  bike: Bike,
  trophy: Trophy,
  tent: Tent,
  mountain: Mountain,
  sun: Sun,
  moon: Moon,
  globe: Globe,
  languages: Languages,
  gradcap: GraduationCap,
  puzzle: Puzzle,
  gamepad: Gamepad2,
  gift: Gift,
  party: PartyPopper,
  rocket: Rocket,
  idea: Lightbulb,
  flower: Flower2,
  paw: PawPrint,
  baby: Baby,
  care: HandHeart,
  waves: Waves,
  crown: Crown,
  landmark: Landmark,
};

/** Tamaños en px. Atados a la escala tipográfica para que el icono no flote. */
const SIZES = {
  xs: 14,
  sm: 16,
  md: 18,
  lg: 22,
  xl: 28,
  '2xl': 40,
};

/**
 * @param {string} name  clave de ICONS
 * @param {string} [label]  texto accesible. Sin él, el icono se marca como
 *   decorativo (aria-hidden) — que es lo correcto cuando va junto a un texto.
 */
const Icon = ({ name, size = 'md', label, className = '', strokeWidth = 1.75, ...props }) => {
  const Glyph = ICONS[name];

  if (!Glyph) {
    // Falla ruidosa en dev, silenciosa en prod: un icono faltante no tira la app.
    if (import.meta.env.DEV) {
      console.warn(`[Icon] No existe el icono "${name}". Agregalo en components/ui/Icon.jsx`);
    }
    return null;
  }

  const px = SIZES[size] ?? SIZES.md;

  return (
    <Glyph
      width={px}
      height={px}
      strokeWidth={strokeWidth}
      className={`shrink-0 ${className}`}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      {...props}
    />
  );
};

export const iconNames = Object.keys(ICONS);
export const iconSizes = Object.keys(SIZES);

export default Icon;
