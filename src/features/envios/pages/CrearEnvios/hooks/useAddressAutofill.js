import { useRef, useState } from "react";
import { useDebouncedCallback } from "@mantine/hooks";
import { useAddressAutofillCore } from "@mapbox/search-js-react";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_API_KEY;

/**
 * @typedef {{ value: string; label: string }} AutofillOption
 * @typedef {{ address: string; coordenadas: { lat: number; lng: number } }} AutofillSelection
 */

/**
 * @param {{ onSelect: (result: AutofillSelection) => void }} options
 */
export const useAddressAutofill = ({ onSelect }) => {
  const autofill = useAddressAutofillCore({ accessToken: MAPBOX_TOKEN });
  const sessionToken = useRef(crypto.randomUUID());
  /** @type {{ current: import('@mapbox/search-js-core').AddressAutofillSuggestion[] }} */
  const suggestionsRef = useRef([]);
  const [autocompleteData, setAutocompleteData] = useState(
    /** @type {AutofillOption[]} */ ([]),
  );
  const [loadingInput, setLoadingInput] = useState(false);
  const [loadingMap, setLoadingMap] = useState(false);
  const [selectedId, setSelectedId] = useState(
    /** @type {string | null} */ (null),
  );

  const fetchSuggestions = useDebouncedCallback(async (value) => {
    if (value.length < 3) {
      suggestionsRef.current = [];
      setAutocompleteData([]);
      setLoadingInput(false);
      return;
    }

    setLoadingInput(true);
    try {
      const result = await autofill.suggest(value, {
        sessionToken: sessionToken.current,
        language: "es",
        country: "AR",
      });

      const valid = result.suggestions.filter(
        (s) => s.mapbox_id && s.full_address,
      );
      suggestionsRef.current = valid;
      setAutocompleteData(
        valid.map((s) => ({
          value: /** @type {string} */ (s.mapbox_id),
          label: /** @type {string} */ (s.full_address),
        })),
      );
    } finally {
      setLoadingInput(false);
    }
  }, 1000);

  const handleChange = (/** @type {string} */ value) => {
    setSelectedId(null);
    if (value.length >= 3) setLoadingInput(true);
    fetchSuggestions(value);
  };

  const handleSelect = async (/** @type {string} */ mapboxId) => {
    const suggestion = suggestionsRef.current.find(
      (s) => s.mapbox_id === mapboxId,
    );
    if (!suggestion) return;

    setLoadingMap(true);
    try {
      const { features } = await autofill.retrieve(suggestion, {
        sessionToken: sessionToken.current,
      });
      const [lng, lat] = features[0].geometry.coordinates;

      sessionToken.current = crypto.randomUUID();
      setSelectedId(mapboxId);
      setAutocompleteData([]);

      onSelect({
        address: /** @type {string} */ (suggestion.full_address),
        coordenadas: { lat, lng },
      });
    } finally {
      setLoadingMap(false);
    }
  };

  return {
    autocompleteData,
    handleChange,
    handleSelect,
    loadingInput,
    loadingMap,
    selectedId,
  };
};
