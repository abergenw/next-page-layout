import { makeLayout } from './layout';
import {
  ChildLayout,
  LoadingComponent,
  mockPageContext,
  ParentLayout,
} from './test-utils';
import { create, act, ReactTestRenderer } from 'react-test-renderer';
import React from 'react';
import { makeLayoutPage } from './page';
import { LayoutPageRenderer } from './LayoutPageRenderer';
import useSWR from 'swr';
import { sleep } from './test-utils';

describe('page', () => {
  test('without getInitialProps', async () => {
    const Parent = makeLayout({
      component: ParentLayout,
      useParentProps: (props) => ({}),
    });

    const Child = makeLayout({
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
    const Parent = makeLayout({
      component: ParentLayout,
      useParentProps: (props) => ({}),
      getInitialProps: async (context) => ({
        one: 'one',
      }),
    });

    const Child = makeLayout({
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

  test('with getInitialProps', async () => {
    const Parent = makeLayout({
      component: ParentLayout,
      useParentProps: (props) => ({}),
      getInitialProps: async (context) => ({
        one: 'one',
      }),
    });

    const Child = makeLayout({
      component: ChildLayout,
      parent: Parent,
      useParentProps: (props) => ({ two: 2 }),
    });

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
        layout: Child,
        useLayoutProps: (props) => ({
          three: 'three',
          four: 4,
        }),
      }
    );

    expect(Page.getInitialProps).toBeDefined();

    const page = create(
      <LayoutPageRenderer
        page={Page}
        initialProps={await Page.getInitialProps?.(mockPageContext)}
      />
    );
    expect(page.toJSON()).toEqual(['one', '2', 'three', '4', 'bar']);
  });

  test('with getInitialProps and useInitialProps', async () => {
    const Parent = makeLayout({
      component: ParentLayout,
      useParentProps: (props) => ({}),
      getInitialProps: async (context) => ({
        one: 'one',
      }),
    });

    const Child = makeLayout({
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
