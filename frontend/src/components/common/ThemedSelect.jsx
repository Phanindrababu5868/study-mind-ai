import Select, { components } from 'react-select';

// Prefixes a lucide icon inside the control, in the same left-icon slot the
// plain <input>/<select> fields use elsewhere on this form.
const withIcon = (Icon) => (props) =>
  (
    <components.Control {...props}>
      <Icon className="w-5 h-5 text-slate-400 ml-3 shrink-0 pointer-events-none" />
      {props.children}
    </components.Control>
  );

/**
 * react-select styled via `unstyled` + `classNames` (Tailwind utility
 * classes per part) rather than the `styles` prop, so it reads and edits
 * like every other Tailwind component in this app instead of a parallel
 * JS-in-CSS theme object.
 *
 * `icon` is optional — pass a lucide-react component to render it inside
 * the control, matching the Calendar/Briefcase/User icons used on the
 * plain inputs on this page.
 */
const ThemedSelect = ({ icon: Icon, invalid = false, ...props }) => (
  <Select
    unstyled
    components={Icon ? { Control: withIcon(Icon) } : undefined}
    classNames={{
      control: ({ isFocused }) =>
        `min-h-12 rounded-xl border-2 bg-slate-50/50 transition-all duration-200 ${
          isFocused
            ? 'border-emerald-500 bg-white shadow-lg shadow-emerald-500/10'
            : invalid
            ? 'border-red-300'
            : 'border-slate-200 hover:border-slate-300'
        }`,
      valueContainer: () => 'px-2 py-2 gap-1',
      input: () => 'text-sm font-medium text-slate-900 m-0 p-0',
      placeholder: () => 'text-sm font-medium text-slate-400',
      singleValue: () => 'text-sm font-medium text-slate-900',
      indicatorsContainer: () => 'pr-2',
      dropdownIndicator: ({ isFocused }) =>
        `p-1 transition-colors duration-200 ${isFocused ? 'text-emerald-500' : 'text-slate-400'}`,
      clearIndicator: () => 'p-1 text-slate-400 hover:text-slate-600 cursor-pointer',
      indicatorSeparator: () => 'hidden',
      menu: () =>
        'mt-2 rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden z-20',
      menuList: () => 'py-1 max-h-60',
      option: ({ isSelected, isFocused }) =>
        `px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors duration-150 ${
          isSelected
            ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white'
            : isFocused
            ? 'bg-emerald-50 text-emerald-700'
            : 'text-slate-700'
        }`,
      noOptionsMessage: () => 'px-4 py-3 text-sm text-slate-400',
    }}
    {...props}
  />
);

export default ThemedSelect;