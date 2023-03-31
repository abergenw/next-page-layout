import { GetServerSideProps, GetStaticProps, NextPage } from 'next';
import {
  BaseLayoutParams,
  fetchGetInitialProps,
  fetchGetServerSideProps,
  fetchGetStaticProps,
  Layout,
  LayoutBaseProps,
  layoutHasGetInitialProps,
  LayoutInitialPropsStack,
  makeLayout,
  MakeLayoutInitialParams,
} from './layout';
import { ComponentType, ReactNode } from 'react';

export type LayoutPage<
  TInitialProps extends LayoutBaseProps,
  TLayout
> = NextPage<
  TInitialProps,
  LayoutInitialPropsStack<PageLayout<TInitialProps, TLayout>>
> & {
  isPage: true;
  layout: PageLayout<TInitialProps, TLayout>;
  _getStaticProps: GetStaticProps<any>;
  _getServerSideProps: GetServerSideProps<any>;
};

type PageLayout<TInitialProps extends LayoutBaseProps, TLayout> = Layout<
  TInitialProps,
  TInitialProps,
  TLayout
>;

interface MakeComplexLayoutPageParams<
  TInitialProps extends LayoutBaseProps,
  TLayout
> {
  component: ComponentType<TInitialProps>;
  layout: TLayout;
  useLayoutProps: BaseLayoutParams<
    TInitialProps,
    TInitialProps,
    TLayout
  >['useParentProps'];
}

interface MakeSimpleLayoutPageParams<TInitialProps extends LayoutBaseProps> {
  component: ComponentType<TInitialProps>;
  renderLayout: (props: TInitialProps & { children: ReactNode }) => ReactNode;
}

type MakeLayoutPageParams<TInitialProps extends LayoutBaseProps, TLayout> =
  | MakeComplexLayoutPageParams<TInitialProps, TLayout>
  | MakeSimpleLayoutPageParams<TInitialProps>;

const isMakeComplexLayoutPageParams = <
  TInitialProps extends LayoutBaseProps,
  TLayout
>(
  params: MakeLayoutPageParams<TInitialProps, TLayout>
): params is MakeComplexLayoutPageParams<TInitialProps, TLayout> => {
  return !!(params as MakeComplexLayoutPageParams<any, any>).layout;
};

const SimpleLayout = makeLayout(undefined, {
  component: function SimpleLayout(props: any) {
    return props.renderLayout(props);
  },
  useParentProps: (props) => ({}),
});

// MakeLayoutPageInitialPropsParams extracted from MakeLayoutPageParams to enable type inference.
export const makeLayoutPage = <
  TInitialProps extends Record<string, any>,
  TLayout
>(
  initialParams: MakeLayoutInitialParams<TInitialProps> | undefined,
  params: MakeLayoutPageParams<TInitialProps, TLayout>
): LayoutPage<TInitialProps, TLayout> => {
  if (isMakeComplexLayoutPageParams(params)) {
    const page: LayoutPage<TInitialProps, TLayout> = (props) => {
      throw new Error(
        'Attempting to render a layout page component without an appropriate renderer. Use LayoutPageRenderer.'
      );
    };
    page.isPage = true;

    const pageLayout = makeLayout(initialParams, {
      component: params.component,
      parent: params.layout,
      useParentProps: params.useLayoutProps,
    });

    page.layout = pageLayout;

    if (layoutHasGetInitialProps(pageLayout)) {
      page.getInitialProps = (context) =>
        fetchGetInitialProps(pageLayout, context);
    }

    page._getStaticProps = async (context) => {
      return {
        props: {
          _plain: await fetchGetStaticProps(pageLayout, context),
        },
      };
    };

    page._getServerSideProps = async (context) => {
      return {
        props: {
          _plain: await fetchGetServerSideProps(pageLayout, context),
        },
      };
    };

    return page;
  }

  const page: LayoutPage<any, any> = (props) => {
    throw new Error(
      'Attempting to render a layout page component without an appropriate renderer. Use LayoutPageRenderer.'
    );
  };
  page.isPage = true;

  const pageLayout = makeLayout(initialParams, {
    component: params.component,
    parent: SimpleLayout,
    useParentProps: (props) =>
      props.requireInitialProps((initialProps) => ({
        ...initialProps,
        renderLayout: params.renderLayout,
      })),
  });

  page.layout = pageLayout;

  if (layoutHasGetInitialProps(pageLayout)) {
    page.getInitialProps = (context) =>
      fetchGetInitialProps(pageLayout, context);
  }

  page._getStaticProps = async (context) => {
    return {
      props: {
        _plain: await fetchGetStaticProps(pageLayout, context),
      },
    };
  };

  page._getServerSideProps = async (context) => {
    return {
      props: {
        _plain: await fetchGetServerSideProps(pageLayout, context),
      },
    };
  };

  return page as any;
};

export type LayoutPageInitialPropsOf<TPage> = TPage extends LayoutPage<
  infer TInitialProps,
  infer TLayout
>
  ? LayoutInitialPropsStack<PageLayout<TInitialProps, TLayout>>
  : never;

export const isLayoutPage = (
  component: ComponentType<any>
): component is LayoutPage<any, any> => {
  return 'isPage' in component;
};
