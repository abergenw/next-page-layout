import React, { ReactNode } from 'react';
import { LayoutBaseProps } from './layout';
import { NextPageContext } from 'next';
import { ErrorComponentProps } from './LayoutRenderer';

export const mockPageContext: NextPageContext = {
  AppTree: () => null,
  pathname: '',
  query: {},
};

export interface ParentLayoutProps extends LayoutBaseProps {
  one: string;
  two: number;
}

export function ParentLayout(props: ParentLayoutProps) {
  return (
    <>
      {props.one}
      {props.two}
      {props.children}
    </>
  );
}

export interface ChildLayoutProps extends LayoutBaseProps {
  three: string;
  four: number;
}

export function ChildLayout(props: ChildLayoutProps) {
  return (
    <>
      {props.three}
      {props.four}
      {props.children}
    </>
  );
}

export interface GrandChildLayoutProps extends LayoutBaseProps {
  five: string;
}

export function GrandChildLayout(props: GrandChildLayoutProps) {
  return (
    <>
      {props.five}
      {props.children}
    </>
  );
}

export function EmptyLayout(props: { children: ReactNode }) {
  return <>{props.children}</>;
}

export function ErrorComponent(props: ErrorComponentProps) {
  return <>{props.error.message}</>;
}

export function LoadingComponent() {
  return <>loading</>;
}

export const sleep = async (ms: number): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
};
