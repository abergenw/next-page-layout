import { makeLayout, MakeLayoutInitialParams } from './layout';
import {
  ChildLayout,
  LoadingComponent,
  mockGetServerSidePropsContext,
  mockGetStaticPropsContext,
  mockPageContext,
  ParentLayout,
  sleep,
} from './test-utils';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import React from 'react';
import { LayoutPage, LayoutPageInitialPropsOf, makeLayoutPage } from './page';
import { LayoutPageRenderer } from './LayoutPageRenderer';
import useSWR from 'swr';

describe('page', () => {
  test('without getInitialProps', async () => {
    const Parent = makeLayout(undefined, {
      component: ParentLayout,
      useParentProps: (props) => ({}),
    });

    const Child = makeLayout(undefined, {
      component: ChildLayout,
      parent: Parent,
      useParentProps: (props) => ({ one: 'one', two: 2 }),
    });

    const Page = makeLayoutPage(undefined, {
      component: (props) => {
        return <>page</>;
      },
      layout: Child,
      useLayoutProps: (props) => ({
        three: 'three',
        four: 4,
      }),
    });

    expect(Page.getInitialProps).toBeUndefined();

    const page = create(
      <LayoutPageRenderer page={Page} initialProps={undefined} />
    );
    expect(page.toJSON()).toEqual(['one', '2', 'three', '4', 'page']);
  });

  test('with layout with getInitialProps', async () => {
    const Parent = makeLayout(
      {
        getInitialProps: async (context) => ({
          one: 'one',
        }),
      },
      {
        component: ParentLayout,
        useParentProps: (props) => ({}),
      }
    );

    const Child = makeLayout(undefined, {
      component: ChildLayout,
      useParentProps: (props) => ({ two: 2 }),
      parent: Parent,
    });

    const Page = makeLayoutPage(undefined, {
      component: (props) => {
        return <>page</>;
      },
      layout: Child,
      useLayoutProps: (props) => ({
        three: 'three',
        four: 4,
      }),
    });

    expect(Page.getInitialProps).toBeDefined();

    const page = create(
      <LayoutPageRenderer
        page={Page}
        initialProps={await Page.getInitialProps?.(mockPageContext)}
      />
    );
    expect(page.toJSON()).toEqual(['one', '2', 'three', '4', 'page']);
  });

  const testWithInitialProps = (params: {
    makeParentInitialParams: MakeLayoutInitialParams<{ one: 'initialOne' }>;
    makePageInitialParams: MakeLayoutInitialParams<{ foo: 'bar' }>;
    fetchInitialParams: <TPage extends LayoutPage<any, any>>(
      page: TPage
    ) => Promise<LayoutPageInitialPropsOf<TPage>> | undefined;
  }) => {
    return async () => {
      const Parent = makeLayout(params.makeParentInitialParams, {
        component: ParentLayout,
        useParentProps: (props) => ({}),
      });

      const Child = makeLayout(undefined, {
        component: ChildLayout,
        parent: Parent,
        useParentProps: (props) => ({ two: 2 }),
      });

      const Page = makeLayoutPage(params.makePageInitialParams, {
        component: (props) => {
          return <>{props.foo}</>;
        },
        layout: Child,
        useLayoutProps: (props) => ({
          three: 'three',
          four: 4,
        }),
      });

      const page = create(
        <LayoutPageRenderer
          page={Page}
          initialProps={await params.fetchInitialParams(Page)}
        />
      );
      expect(page.toJSON()).toEqual(['initialOne', '2', 'three', '4', 'bar']);
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
      makePageInitialParams: {
        getInitialProps: async (context) => ({
          foo: 'bar',
        }),
      },
      fetchInitialParams: (page) => {
        expect(page.getInitialProps).toBeDefined();
        return page.getInitialProps?.(mockPageContext) as any;
      },
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
      makePageInitialParams: {
        getServerSideProps: async (context) => ({
          foo: 'bar',
        }),
      },
      fetchInitialParams: async (page) => {
        expect(page._getServerSideProps).toBeDefined();
        return (
          (await page._getServerSideProps?.(
            mockGetServerSidePropsContext
          )) as any
        ).props;
      },
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
      makePageInitialParams: {
        getStaticProps: async (context) => ({
          foo: 'bar',
        }),
      },
      fetchInitialParams: async (page) => {
        expect(page._getStaticProps).toBeDefined();
        return (
          (await page._getStaticProps?.(mockGetStaticPropsContext)) as any
        ).props;
      },
    })
  );

  test('with getInitialProps and useInitialProps', async () => {
    const Parent = makeLayout(
      {
        getInitialProps: async (context) => ({
          one: 'one',
        }),
      },
      {
        component: ParentLayout,
        useParentProps: (props) => ({}),
      }
    );

    const Child = makeLayout(undefined, {
      component: ChildLayout,
      parent: Parent,
      useParentProps: (props) => ({ two: 2 }),
    });

    const Page = makeLayoutPage(
      {
        useInitialProps: () => {
          const result = useSWR(
            'pageWithGetInitialPropsAndUseInitialProps',
            async () => {
              await sleep(100);
              return 'bar';
            }
          );

          return {
            data: {
              foo: result.data,
              four: 4,
            },
            loading: !result.data,
          };
        },
      },
      {
        component: (props) => {
          return <>{props.foo}</>;
        },
        layout: Child,
        useLayoutProps: (props) => ({
          three: 'three',
          four: 4,
        }),
      }
    );

    expect(Page.getInitialProps).toBeDefined();

    let renderer: ReactTestRenderer = null as any;

    await act(async () => {
      renderer = create(
        <LayoutPageRenderer
          page={Page}
          initialProps={await Page.getInitialProps?.(mockPageContext)}
          loadingComponent={LoadingComponent}
        />
      );
    });

    expect(renderer.toJSON()).toEqual(['one', '2', 'three', '4', 'loading']);

    await act(async () => {
      jest.runAllTimers();
    });

    expect(renderer.toJSON()).toEqual(['one', '2', 'three', '4', 'bar']);
  });

  test('with simple layout', async () => {
    const Page = makeLayoutPage(
      {
        getInitialProps: async (context) => ({
          foo: 'bar',
        }),
      },
      {
        component: (props) => {
          return <>{props.foo}</>;
        },
        renderLayout: (props) => {
          return (
            <>
              layout
              {props.foo}
              {props.children}
            </>
          );
        },
      }
    );

    expect(Page.getInitialProps).toBeDefined();

    const page = create(
      <LayoutPageRenderer
        page={Page}
        initialProps={await Page.getInitialProps?.(mockPageContext)}
      />
    );
    expect(page.toJSON()).toEqual(['layout', 'bar', 'bar']);
  });
});
