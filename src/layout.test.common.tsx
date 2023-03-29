import {
  ChildLayout,
  ErrorComponent,
  GrandChildLayout,
  IsomorphicRenderer,
  mockGetServerSidePropsContext,
  mockGetStaticPropsContext,
  mockPageContext,
  ParentLayout,
} from './test-utils';
import {
  fetchGetInitialProps,
  fetchGetServerSideProps,
  fetchGetStaticProps,
  LayoutInitialPropsStack,
  makeLayout,
  MakeLayoutInitialParams,
} from './layout';
import { LayoutRenderer } from './LayoutRenderer';
import React from 'react';

export const commonLayoutTests = (renderer: IsomorphicRenderer) => {
  test('with parent and child', async () => {
    const Parent = makeLayout(undefined, {
      component: ParentLayout,
      useParentProps: (props) => ({}),
    });

    renderer.renderAndExpect(
      <LayoutRenderer
        layout={Parent}
        layoutProps={{ one: 'one', two: 2 }}
        initialProps={await fetchGetInitialProps(Parent, mockPageContext)}
      >
        content
      </LayoutRenderer>,
      ['one', '2', 'content']
    );

    const Child = makeLayout(undefined, {
      component: ChildLayout,
      parent: Parent,
      useParentProps: (props) => ({
        one: 'one',
        two: 2,
      }),
    });

    renderer.renderAndExpect(
      <LayoutRenderer
        layout={Child}
        layoutProps={{ three: 'three', four: 4 }}
        initialProps={await fetchGetInitialProps(Child, mockPageContext)}
      >
        content
      </LayoutRenderer>,
      ['one', '2', 'three', '4', 'content']
    );

    const GrandChild = makeLayout(undefined, {
      component: GrandChildLayout,
      parent: Child,
      useParentProps: (props) => ({ three: 'three', four: 4 }),
    });

    renderer.renderAndExpect(
      <LayoutRenderer
        layout={GrandChild}
        layoutProps={{
          five: 'five',
        }}
        initialProps={await fetchGetInitialProps(GrandChild, mockPageContext)}
      >
        content
      </LayoutRenderer>,
      ['one', '2', 'three', '4', 'five', 'content']
    );
  });

  const testWithInitialProps = (params: {
    makeParentInitialParams: MakeLayoutInitialParams<{ one: 'initialOne' }>;
    makeChildInitialParams: MakeLayoutInitialParams<{ three: 'initialThree' }>;
    makeGrandChildInitialParams: MakeLayoutInitialParams<{
      five: 'initialFive';
    }>;
    fetchInitialParams: <TLayout>(
      layout: TLayout
    ) => Promise<LayoutInitialPropsStack<TLayout>>;
  }) => {
    return async () => {
      const Parent = makeLayout(params.makeParentInitialParams, {
        component: ParentLayout,
        useParentProps: (props) => ({}),
      });

      const Child = makeLayout(params.makeChildInitialParams, {
        component: ChildLayout,
        parent: Parent,
        useParentProps: (props) =>
          props.requireLayoutProps((layoutProps) => ({
            two: layoutProps.four,
          })),
      });

      renderer.renderAndExpect(
        <LayoutRenderer
          layout={Child}
          layoutProps={{ four: 4 }}
          initialProps={await params.fetchInitialParams(Child)}
        >
          content
        </LayoutRenderer>,
        ['initialOne', '4', 'initialThree', '4', 'content']
      );

      const GrandChild = makeLayout(params.makeGrandChildInitialParams, {
        component: GrandChildLayout,
        parent: Child,
        useParentProps: (props) => ({
          four: 4,
        }),
      });

      renderer.renderAndExpect(
        <LayoutRenderer
          layout={GrandChild}
          layoutProps={{}}
          initialProps={await params.fetchInitialParams(GrandChild)}
        >
          content
        </LayoutRenderer>,
        ['initialOne', '4', 'initialThree', '4', 'initialFive', 'content']
      );
    };
  };

  test(
    'with getInitialProps',
    testWithInitialProps({
      makeParentInitialParams: {
        getInitialProps: async (context) => ({
          one: 'initialOne',
        }),
      },
      makeChildInitialParams: {
        getInitialProps: async (context) => ({
          three: 'initialThree',
        }),
      },
      makeGrandChildInitialParams: {
        getInitialProps: async (context) => ({
          five: 'initialFive',
        }),
      },
      fetchInitialParams: (layout) =>
        fetchGetInitialProps(layout, mockPageContext),
    })
  );

  test(
    'with getServerSideProps',
    testWithInitialProps({
      makeParentInitialParams: {
        getServerSideProps: async (context) => ({
          one: 'initialOne',
        }),
      },
      makeChildInitialParams: {
        getServerSideProps: async (context) => ({
          three: 'initialThree',
        }),
      },
      makeGrandChildInitialParams: {
        getServerSideProps: async (context) => ({
          five: 'initialFive',
        }),
      },
      fetchInitialParams: (layout) =>
        fetchGetServerSideProps(layout, mockGetServerSidePropsContext),
    })
  );

  test(
    'with getStaticProps',
    testWithInitialProps({
      makeParentInitialParams: {
        getStaticProps: async (context) => ({
          one: 'initialOne',
        }),
      },
      makeChildInitialParams: {
        getStaticProps: async (context) => ({
          three: 'initialThree',
        }),
      },
      makeGrandChildInitialParams: {
        getStaticProps: async (context) => ({
          five: 'initialFive',
        }),
      },
      fetchInitialParams: (layout) =>
        fetchGetStaticProps(layout, mockGetStaticPropsContext),
    })
  );

  test('with getInitialProps error', async () => {
    const Parent = makeLayout(
      {
        getInitialProps: async (context) => ({
          one: 'one',
          two: 2,
        }),
      },
      {
        component: ParentLayout,
        useParentProps: (props) => ({}),
      }
    );

    const ChildWithError = makeLayout(
      {
        getInitialProps: async (context) => {
          throw new Error('child');
          return {
            three: 'three',
            four: 4,
          };
        },
      },
      {
        component: ChildLayout,
        parent: Parent,
        useParentProps: (props) => ({}),
      }
    );

    renderer.renderAndExpect(
      <LayoutRenderer
        layout={ChildWithError}
        layoutProps={{}}
        initialProps={
          await fetchGetInitialProps(ChildWithError, mockPageContext)
        }
        errorComponent={ErrorComponent}
      >
        content
      </LayoutRenderer>,
      ['one', '2', 'child']
    );

    const ParentWithError = makeLayout(
      {
        getInitialProps: async (context) => {
          throw new Error('parent');
          return {
            one: 'one',
            two: 2,
          };
        },
      },
      {
        component: ParentLayout,
        useParentProps: (props) => ({}),
      }
    );

    const Child = makeLayout(
      {
        getInitialProps: async (context) => {
          return {
            three: 'three',
            four: 4,
          };
        },
      },
      {
        component: ChildLayout,
        parent: ParentWithError,
        useParentProps: (props) => ({}),
      }
    );

    renderer.renderAndExpect(
      <LayoutRenderer
        layout={Child}
        layoutProps={{}}
        initialProps={await fetchGetInitialProps(Child, mockPageContext)}
        errorComponent={ErrorComponent}
      >
        content
      </LayoutRenderer>,
      ['parent']
    );
  });
};
