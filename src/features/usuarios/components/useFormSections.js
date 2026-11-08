import { useState } from 'react';

/**
 * Estado de las secciones plegables de `FormSections` (mobile).
 *
 * `sections`: `[{ value, title, icon, fields: string[], cardProps?, children }]`.
 * La primera arranca abierta en mobile; `revealErrors(errors)` abre las que tengan
 * campos con error (se usa como segundo argumento de `form.onSubmit`).
 */
export const useFormSections = (sections) => {
  const [opened, setOpened] = useState(() => (sections[0] ? [sections[0].value] : []));

  const revealErrors = (errors) => {
    const withError = sections
      .filter((s) => s.fields.some((f) => errors?.[f]))
      .map((s) => s.value);
    if (withError.length > 0) {
      setOpened((prev) => Array.from(new Set([...prev, ...withError])));
    }
  };

  return { opened, setOpened, revealErrors };
};

