import { NextPage, NextPageContext } from 'next';
import {
  fetchGetInitialProps,
  InitialProps,
  Layout,
  layoutHasGetInitialProps,
  LayoutInitialPropsStack,
  LayoutProps,
  makeLayout,
} from './layout';
import { ComponentType, ReactNode } from 'react';

export type LayoutPage<
  TInitialProps,
  TLayout extends Layout<any, any, any, any>
> = NextPage<
  TInitialProps,
  LayoutInitialPropsStack<PageLayout<TInitialProps, TLayout>>
> & {
  isPage: boolean;
  layout: PageLayout<TInitialProps, TLayout>;
};

type PageLayout<
  TInitialProps,
  TLayout extends Layout<any, any, any, any>
> = Layout<TInitialProps, TInitialProps, TLayout, LayoutProps<TLayout>>;

interface MakeLayoutPageGetInitialPropsParams<TInitialProps> {
  getInitialProps: (context: NextPageContext) => Promise<TInitialProps>;
}

interface MakeLayoutPageUseInitialPropsParams<TInitialProps> {
  useInitialProps: () => InitialProps<TInitialProps>;
}

type MakeLayoutPageInitialPropsParams<TInitialProps> =
  | MakeLayoutPageGetInitialPropsParams<TInitialProps>
  | MakeLayoutPageUseInitialPropsParams<TInitialProps>;

interface MakeComplexLayoutPageParams<
  TInitialProps,
  TLayout extends Layout<any, any, any, any>
> {
  component: ComponentType<TInitialProps>;
  layout: TLayout;
  useLayoutProps: (props: TInitialProps) => LayoutProps<TLayout>;
}

interface MakeSimpleLayoutPageParams<TInitialProps> {
  component: ComponentType<TInitialProps>;
  renderLayout: (props: TInitialProps & { children: ReactNode }) => ReactNode;
}

type MakeLayoutPageParams<
  TInitialProps,
  TLayout extends Layout<any, any, any, any>
> =
  | MakeComplexLayoutPageParams<TInitialProps, TLayout>
  | MakeSimpleLayoutPageParams<TInitialProps>;

const isMakeComplexLayoutPageParams = <
  TInitialProps,
  TLayout extends Layout<any, any, any, any>
>(
  params: MakeLayoutPageParams<TInitialProps, TLayout>
): params is MakeComplexLayoutPageParams<TInitialProps, TLayout> => {
  return !!(params as MakeComplexLayoutPageParams<any, any>).layout;
};

const SimpleLayout = makeLayout({
  component: function SimpleLayout(props: any) {
    return props.renderLayout(props);
  },
});

// MakeLayoutPageInitialPropsParams extracted from MakeLayoutPageParams to enable type inference.
export const makeLayoutPage = <
  TInitialProps,
  TLayout extends Layout<any, any, any, any>
>(
  initialPropsParams:
    | MakeLayoutPageInitialPropsParams<TInitialProps>
    | undefined,
  params: MakeLayoutPageParams<TInitialProps, TLayout>
): LayoutPage<TInitialProps, TLayout> => {
  if (isMakeComplexLayoutPageParams(params)) {
    const page: LayoutPage<TInitialProps, TLayout> = (props) => {
      throw new Error(
        'Attempting to render a layout page component without an appropriate renderer. Use LayoutPageRenderer.'
      );
    };
    page.isPage = true;

    const pageLayout = makeLayout({
      component: params.component,
      parent: params.layout,
      useParentProps: params.useLayoutProps,
      getInitialProps: (
        initialPropsParams as MakeLayoutPageGetInitialPropsParams<TInitialProps>
      )?.getInitialProps,
      useInitialProps: (
        initialPropsParams as MakeLayoutPageUseInitialPropsParams<TInitialProps>
      )?.useInitialProps,
    });

    page.layout = pageLayout;

    if (layoutHasGetInitialProps(pageLayout)) {
      page.getInitialProps = (context) =>
        fetchGetInitialProps(pageLayout, context);
    }

    return page;
  }

  const page: LayoutPage<any, any> = (props) => {
    throw new Error(
      'Attempting to render a layout page component without an appropriate renderer. Use LayoutPageRenderer.'
    );
  };
  page.isPage = true;

  const pageLayout = makeLayout({
    component: params.component,
    parent: SimpleLayout,
    useParentProps: (props) => ({
      ...props,
      renderLayout: params.renderLayout,
    }),
    getInitialProps: (
      initialPropsParams as MakeLayoutPageGetInitialPropsParams<TInitialProps>
    )?.getInitialProps,
    useInitialProps: (
      initialPropsParams as MakeLayoutPageUseInitialPropsParams<TInitialProps>
    )?.useInitialProps,
  });

  page.layout = pageLayout;

  if (layoutHasGetInitialProps(pageLayout)) {
    page.getInitialProps = (context) =>
      fetchGetInitialProps(pageLayout, context);
  }

  return page as any;
};

export type LayoutPageInitialPropsOf<TPage extends LayoutPage<any, any>> =
  TPage extends LayoutPage<infer TInitialProps, infer TLayout>
    ? LayoutInitialPropsStack<PageLayout<TInitialProps, TLayout>>
    : never;

export const isLayoutPage = (
  component: ComponentType<any>
): component is LayoutPage<any, any> => {
  return 'isPage' in component;
};
