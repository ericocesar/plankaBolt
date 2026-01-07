import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { ThemeProvider } from '@gravity-ui/uikit';
import Support from './Support';
import { parsePrefill } from '../../utils/embedHelpers';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function Embed() {
  const query = useQuery();

  const hideHeader = query.get('hideHeader') === '1';
  const theme = query.get('theme') === 'dark' ? 'dark' : 'light';
  // const lang = query.get('lang'); // TODO: Implement language switching if i18n is available
  const prefillParam = query.get('prefill');

  const prefillData = useMemo(() => {
    return parsePrefill(prefillParam);
  }, [prefillParam]);

  return (
    <ThemeProvider theme={theme}>
      <div style={{ width: '100%', minHeight: '100vh', background: 'transparent' }}>
        <Support isEmbed hideHeader={hideHeader} prefillData={prefillData} />
      </div>
    </ThemeProvider>
  );
}

export default Embed;
