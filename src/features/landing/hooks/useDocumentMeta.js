import { useEffect } from 'react';

/**
 * SEO básico para páginas públicas que no tienen su propio HTML estático
 * (`index.html` sólo define el `<title>` por defecto de toda la SPA):
 * setea `document.title` y crea/actualiza `<meta name="description">` +
 * Open Graph (`og:title`, `og:description`, `og:type`, `og:url`) mientras el
 * componente está montado, restaurando lo previo al desmontar (para no
 * "ensuciar" el `<head>` si el visitante navega a otra pantalla).
 *
 * @param {Object} meta
 * @param {string} meta.title
 * @param {string} [meta.description]
 * @param {string} [meta.ogType='website']
 */
export const useDocumentMeta = ({ title, description, ogType = 'website' }) => {
  useEffect(() => {
    const previousTitle = document.title;
    if (title) document.title = title;

    const tags = [
      { attr: 'name', key: 'description', content: description },
      { attr: 'property', key: 'og:title', content: title },
      { attr: 'property', key: 'og:description', content: description },
      { attr: 'property', key: 'og:type', content: ogType },
      { attr: 'property', key: 'og:url', content: window.location.href },
    ].filter((tag) => tag.content);

    const restoreFns = tags.map(({ attr, key, content }) => {
      const selector = `meta[${attr}="${key}"]`;
      const existing = document.head.querySelector(selector);

      if (existing) {
        const previousContent = existing.getAttribute('content');
        existing.setAttribute('content', content);
        return () => existing.setAttribute('content', previousContent ?? '');
      }

      const element = document.createElement('meta');
      element.setAttribute(attr, key);
      element.setAttribute('content', content);
      document.head.appendChild(element);
      return () => element.remove();
    });

    return () => {
      document.title = previousTitle;
      restoreFns.forEach((restore) => restore());
    };
  }, [title, description, ogType]);
};
