import React, { ReactNode } from 'react';
import LayoutComponent from '../LayoutComponent';

interface Props {
  subtitle: string;
  children: ReactNode;
}

export default function SimpleLayoutComponent(props: Props) {
  return (
    <LayoutComponent
      {...props}
      title="Simple"
      linkPrefix="simple/"
      description={
        <>
          <p>
            This is the simplest way to preserve state when navigating between
            pages using the same layout.
          </p>

          <p>No layout hierarchy or data fetching features are used.</p>
        </>
      }
    >
      {props.children}
    </LayoutComponent>
  );
}
