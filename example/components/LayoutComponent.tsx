import React, { ReactNode } from 'react';
import MainLayoutComponent from './MainLayoutComponent';
import SubLayoutComponent from './SubLayoutComponent';

interface Props {
  title: ReactNode;
  description: ReactNode;
  subtitle: ReactNode;
  linkPrefix: string;
  children: ReactNode;
}

export default function LayoutComponent(props: Props) {
  return (
    <MainLayoutComponent {...props}>
      <SubLayoutComponent {...props}>{props.children}</SubLayoutComponent>
    </MainLayoutComponent>
  );
}
