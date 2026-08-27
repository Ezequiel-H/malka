const CalendarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
    aria-hidden="true"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const DateInput = ({
  id,
  name,
  value,
  onChange,
  required = false,
  max,
  className = '',
  ...props
}) => (
  <div className="form-date-field relative w-full min-w-0">
    <input
      id={id}
      type="date"
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      max={max}
      className={`form-input-date bg-white ${className}`.trim()}
      {...props}
    />
    <span className="form-date-field-icon pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
      <CalendarIcon />
    </span>
  </div>
);

export default DateInput;
