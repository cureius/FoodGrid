'use client';

import React, { useState } from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import { ServerStyleSheet, StyleSheetManager } from 'styled-components';
import sheet from 'node_modules/styled-components/dist/sheet';

export default function StyledComponentsRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize the stylesheet once
  const [styledComponentsStyleSheet] = useState(() => new ServerStyleSheet());

  useServerInsertedHTML(() => {
    const styles = styledComponentsStyleSheet.getStyleElement();
    
    // For Styled Components v6, we clear the tag to prevent duplicate styles 
    // during fast refresh/re-renders in development.
    // @ts-ignore
    styledComponentsStyleSheet.instance.clearTag();
    
    return <>{styles}</>;
  });

  // During client-side rendering, just return children
  if (typeof window !== 'undefined') return <>{children}</>;

  return (
    <StyleSheetManager sheet={styledComponentsStyleSheet.instance}>
      {children}
    </StyleSheetManager>
  );
}