import { useId, type ComponentProps } from "react";
import { Input } from "./input";
/** Native text suggestions. Accepts free text; validate catalog membership on the server when required. */
export function Combobox({
  options,
  ...props
}: Omit<ComponentProps<typeof Input>, "list"> & {
  options: readonly { value: string; label?: string }[];
}) {
  const id = useId();
  return (
    <>
      <Input {...props} list={id} />
      <datalist id={id}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </datalist>
    </>
  );
}
