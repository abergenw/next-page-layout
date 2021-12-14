import React, { ReactElement, ReactNode } from 'react';
import { LayoutBaseProps } from './layout';
import {
  GetServerSidePropsContext,
  GetStaticPropsContext,
  NextPageContext,
} from 'next';
import { ErrorComponentProps } from './LayoutRenderer';
import {
  createLayoutPropsContext,
  LayoutPropsProvider,
} from './LayoutPropsProvider';
import { renderToString } from 'react-dom/server';
import { create } from 'react-test-renderer';

export const mockPageContext: NextPageContext = {
  AppTree: () => null,
  pathname: '',
  query: {},
};

export const mockGetServerSidePropsContext: GetServerSidePropsContext =
  {} as any;

export const mockGetStaticPropsContext: GetStaticPropsContext = {} as any;

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

export interface ChildLayoutProps extends Partial<ParentLayoutProps> {
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

export interface GrandChildLayoutProps extends Partial<ChildLayoutProps> {
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
  return <>{props.error?.message}</>;
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

export interface IsomorphicRenderer {
  renderAndExpect: (element: ReactElement, expected: string[]) => void;
}

export const clientRenderer: IsomorphicRenderer = {
  renderAndExpect: (element, expected) => {
    const result = create(element);
    const json = result.toJSON();
    expect(Array.isArray(json) ? json : [json]).toEqual(expected);
  },
};

export const ssrRenderer: IsomorphicRenderer = {
  renderAndExpect: (element, expected) => {
    const layoutPropsContext = createLayoutPropsContext();

    renderToString(
      <LayoutPropsProvider context={layoutPropsContext}>
        {element}
      </LayoutPropsProvider>
    );
    const result = renderToString(
      <LayoutPropsProvider context={layoutPropsContext}>
        {element}
      </LayoutPropsProvider>
    );
    expect(result.split('<!-- -->')).toEqual(expected);
  },
};
