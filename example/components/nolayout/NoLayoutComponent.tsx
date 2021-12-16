import React, { ReactNode } from 'react';
import LayoutComponent from '../LayoutComponent';

interface Props {
  subtitle: ReactNode;
  children: ReactNode;
}

export default function NoLayoutComponent(props: Props) {
  return (
    <LayoutComponent
      {...props}
      title="No layout"
      linkPrefix="nolayout/"
      description={
        <>
          This is default Nextjs behaviour. No state is persisted when
          navigating between pages using the same layout.
        </>
      }
    >
      {props.children}
    </LayoutComponent>
  );
}
