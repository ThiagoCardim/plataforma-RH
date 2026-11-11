/** The access layer uses “Profissional” when profiles.display_name is missing.
 * Treat that legacy fallback as absent in presentation, never as a person's name.
 */
export function personalName(value: string | null | undefined) {
  const name = value?.trim();
  return name && name.toLocaleLowerCase("pt-BR") !== "profissional"
    ? name
    : null;
}
