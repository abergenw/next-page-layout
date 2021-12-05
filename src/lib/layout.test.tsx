import React, { useLayoutEffect, useState } from 'react';
import { fetchGetInitialProps, makeLayout } from './layout';
import { create, act, ReactTestRenderer } from 'react-test-renderer';
import { LayoutRenderer } from './LayoutRenderer';
import {
  ChildLayout,
  EmptyLayout,
  ErrorComponent,
  GrandChildLayout,
  LoadingComponent,
  mockPageContext,
  ParentLayout,
} from './test-utils';
import useSWR from 'swr';
import { sleep } from '../example/components/utils';

describe('layout', () => {
  test('with parent and child', async () => {
    const Parent = makeLayout({
      component: ParentLayout,
    });

    const parent = create(
      <LayoutRenderer
        layout={Parent}
        layoutProps={{ one: 'one', two: 2 }}
        initialProps={await fetchGetInitialProps(Parent, mockPageContext)}
      >
        content
      </LayoutRenderer>
    );
    expect(parent.toJSON()).toEqual(['one', '2', 'content']);

    const Child = makeLayout({
      component: ChildLayout,
      parent: Parent,
    });

    const child = create(
      <LayoutRenderer
        layout={Child}
        layoutProps={{ one: 'one', two: 2, three: 'three', four: 4 }}
        initialProps={await fetchGetInitialProps(Child, mockPageContext)}
      >
        content
      </LayoutRenderer>
    );
    expect(child.toJSON()).toEqual(['one', '2', 'three', '4', 'content']);

    const GrandChild = makeLayout({
      component: GrandChildLayout,
      parent: Child,
    });

    const grandChild = create(
      <LayoutRenderer
        layout={GrandChild}
        layoutProps={{
          one: 'one',
          two: 2,
          three: 'three',
          four: 4,
          five: 'five',
        }}
        initialProps={await fetchGetInitialProps(GrandChild, mockPageContext)}
      >
        content
      </LayoutRenderer>
    );
    expect(grandChild.toJSON()).toEqual([
      'one',
      '2',
      'three',
      '4',
      'five',
      'content',
    ]);
  });

  test('with useParentProps', async () => {
    const Parent = makeLayout({
      component: ParentLayout,
    });

    const Child = makeLayout({
      component: ChildLayout,
      parent: Parent,
      useParentProps: (props) => ({
        one: props.three,
      }),
    });

    const child = create(
      <LayoutRenderer
        layout={Child}
        layoutProps={{ two: 2, three: 'three', four: 4 }}
        initialProps={await fetchGetInitialProps(Child, mockPageContext)}
      >
        content
      </LayoutRenderer>
    );
    expect(child.toJSON()).toEqual(['three', '2', 'three', '4', 'content']);

    const GrandChild = makeLayout({
      component: GrandChildLayout,
      parent: Child,
      useParentProps: (props) => ({
        two: 22,
        four: 44,
      }),
    });

    const grandChild = create(
      <LayoutRenderer
        layout={GrandChild}
        layoutProps={{ three: 'three', five: 'five' }}
        initialProps={await fetchGetInitialProps(GrandChild, mockPageContext)}
      >
        content
      </LayoutRenderer>
    );
    expect(grandChild.toJSON()).toEqual([
      'three',
      '22',
      'three',
      '44',
      'five',
      'content',
    ]);
  });

  test('with getInitialProps', async () => {
    const Parent = makeLayout({
      component: ParentLayout,
      getInitialProps: async (context) => ({
        one: 'initialOne',
      }),
    });

    const Child = makeLayout({
      component: ChildLayout,
      parent: Parent,
      useParentProps: (props) => ({
        two: props.four,
      }),
      getInitialProps: async (context) => ({
        three: 'initialThree',
      }),
    });

    const child = create(
      <LayoutRenderer
        layout={Child}
        layoutProps={{ four: 4 }}
        initialProps={await fetchGetInitialProps(Child, mockPageContext)}
      >
        content
      </LayoutRenderer>
    );
    expect(child.toJSON()).toEqual([
      'initialOne',
      '4',
      'initialThree',
      '4',
      'content',
    ]);

    const GrandChild = makeLayout({
      component: GrandChildLayout,
      parent: Child,
      useParentProps: (props) => ({
        four: 4,
      }),
      getInitialProps: async (context) => ({
        five: 'initialFive',
      }),
    });

    const grandChild = create(
      <LayoutRenderer
        layout={GrandChild}
        layoutProps={{}}
        initialProps={await fetchGetInitialProps(GrandChild, mockPageContext)}
      >
        content
      </LayoutRenderer>
    );

    expect(grandChild.toJSON()).toEqual([
      'initialOne',
      '4',
      'initialThree',
      '4',
      'initialFive',
      'content',
    ]);
  });

  test('with getInitialProps error', async () => {
    const Parent = makeLayout({
      component: ParentLayout,
      getInitialProps: async (context) => ({
        one: 'one',
        two: 2,
      }),
    });

    const ChildWithError = makeLayout({
      component: ChildLayout,
      parent: Parent,
      getInitialProps: async (context) => {
        throw new Error('child');
        return {
          three: 'three',
          four: 4,
        };
      },
    });

    const childWithError = create(
      <LayoutRenderer
        layout={ChildWithError}
        layoutProps={{}}
        initialProps={
          await fetchGetInitialProps(ChildWithError, mockPageContext)
        }
        errorComponent={ErrorComponent}
      >
        content
      </LayoutRenderer>
    );
    expect(childWithError.toJSON()).toEqual(['one', '2', 'child']);

    const ParentWithError = makeLayout({
      component: ParentLayout,
      getInitialProps: async (context) => {
        throw new Error('parent');
        return {
          one: 'one',
          two: 2,
        };
      },
    });

    const Child = makeLayout({
      component: ChildLayout,
      parent: ParentWithError,
      getInitialProps: async (context) => {
        return {
          three: 'three',
          four: 4,
        };
      },
    });

    const parentWithError = create(
      <LayoutRenderer
        layout={Child}
        layoutProps={{}}
        initialProps={await fetchGetInitialProps(Child, mockPageContext)}
        errorComponent={ErrorComponent}
      >
        content
      </LayoutRenderer>
    );
    expect(parentWithError.toJSON()).toEqual('parent');
  });

  test('stays mounted', async () => {
    let parentMountedTimes = 0;
    let parentRenderedTimes = 0;

    const Parent = makeLayout({
      component: function Component(props) {
        parentRenderedTimes++;
        useLayoutEffect(() => {
          parentMountedTimes++;
        }, []);
        return <>{props.children}</>;
      },
    });

    const Child1 = makeLayout({
      component: EmptyLayout,
      parent: Parent,
    });

    const Child2 = makeLayout({
      component: EmptyLayout,
      parent: Parent,
    });

    const parent = create(
      <LayoutRenderer
        layout={Child1}
        layoutProps={{}}
        initialProps={await fetchGetInitialProps(Child1, mockPageContext)}
        errorComponent={ErrorComponent}
      >
        content
      </LayoutRenderer>
    );

    expect(parentMountedTimes).toBe(1);
    expect(parentRenderedTimes).toBe(1);

    parent.update(
      <LayoutRenderer
        layout={Child2}
        layoutProps={{}}
        initialProps={await fetchGetInitialProps(Child1, mockPageContext)}
        errorComponent={ErrorComponent}
      >
        content
      </LayoutRenderer>
    );

    expect(parentMountedTimes).toBe(1);
    expect(parentRenderedTimes).toBe(2);
  });

  test('with different useParentProps hooks', async () => {
    const Parent = makeLayout({
      component: EmptyLayout,
    });

    // Using hook in useParentProps.
    const Child1 = makeLayout({
      component: EmptyLayout,
      parent: Parent,
      useParentProps: (props) => {
        useState(false);
        return {};
      },
    });

    // No hooks.
    const Child2 = makeLayout({
      component: EmptyLayout,
      parent: Parent,
    });

    const parent = create(
      <LayoutRenderer
        layout={Child1}
        layoutProps={{}}
        initialProps={await fetchGetInitialProps(Child1, mockPageContext)}
        errorComponent={ErrorComponent}
      >
        content
      </LayoutRenderer>
    );

    parent.update(
      <LayoutRenderer
        layout={Child2}
        layoutProps={{}}
        initialProps={await fetchGetInitialProps(Child1, mockPageContext)}
        errorComponent={ErrorComponent}
      >
        content
      </LayoutRenderer>
    );

    parent.update(
      <LayoutRenderer
        layout={Child1}
        layoutProps={{}}
        initialProps={await fetchGetInitialProps(Child1, mockPageContext)}
        errorComponent={ErrorComponent}
      >
        content
      </LayoutRenderer>
    );
  });

  test('with useInitialProps', async () => {
    const Parent = makeLayout({
      component: ParentLayout,
      useInitialProps: () => {
        const result = useSWR('layoutWithUseInitialProps:parent', async () => {
          await sleep(100);
          return 'initialOne';
        });

        return {
          data: {
            one: result.data,
          },
          loading: !result.data,
        };
      },
    });

    let renderer: ReactTestRenderer = null as any;

    act(() => {
      renderer = create(
        <LayoutRenderer
          layout={Parent}
          layoutProps={{ two: 2 }}
          initialProps={undefined}
          errorComponent={ErrorComponent}
          loadingComponent={LoadingComponent}
        >
          content
        </LayoutRenderer>
      );
    });

    expect(renderer.toJSON()).toEqual('loading');

    await act(async () => {
      jest.runAllTimers();
    });

    expect(renderer.toJSON()).toEqual(['initialOne', '2', 'content']);

    // Navigate to Child1.

    const Child1 = makeLayout({
      component: ChildLayout,
      parent: Parent,
      useParentProps: (props) => ({
        two: 22,
      }),
      useInitialProps: () => {
        const result = useSWR('layoutWithUseInitialProps:child1', async () => {
          await sleep(100);
          return 'child1';
        });

        return {
          data: {
            three: result.data,
            four: 4,
          },
          loading: !result.data,
        };
      },
    });

    act(() => {
      renderer.update(
        <LayoutRenderer
          layout={Child1}
          layoutProps={{}}
          initialProps={undefined}
          errorComponent={ErrorComponent}
          loadingComponent={LoadingComponent}
        >
          content
        </LayoutRenderer>
      );
    });

    expect(renderer.toJSON()).toEqual(['initialOne', '22', 'loading']);

    await act(async () => {
      jest.runAllTimers();
    });

    expect(renderer.toJSON()).toEqual([
      'initialOne',
      '22',
      'child1',
      '4',
      'content',
    ]);

    // Navigate to Child2.

    const Child2 = makeLayout({
      component: ChildLayout,
      parent: Parent,
      useParentProps: (props) => ({
        two: 2222,
      }),
      useInitialProps: () => {
        const result = useSWR('layoutWithUseInitialProps:child2', async () => {
          await sleep(100);
          return 'child2';
        });

        return {
          data: {
            three: result.data,
            four: 44,
          },
          loading: !result.data,
        };
      },
    });

    act(() => {
      renderer.update(
        <LayoutRenderer
          layout={Child2}
          layoutProps={{}}
          initialProps={undefined}
          errorComponent={ErrorComponent}
          loadingComponent={LoadingComponent}
        >
          content
        </LayoutRenderer>
      );
    });

    expect(renderer.toJSON()).toEqual(['initialOne', '2222', 'loading']);

    await act(async () => {
      jest.runAllTimers();
    });

    expect(renderer.toJSON()).toEqual([
      'initialOne',
      '2222',
      'child2',
      '44',
      'content',
    ]);

    // Navigate back to Child1, no loading state expected.

    act(() => {
      renderer.update(
        <LayoutRenderer
          layout={Child1}
          layoutProps={{}}
          initialProps={undefined}
          errorComponent={ErrorComponent}
          loadingComponent={LoadingComponent}
        >
          content
        </LayoutRenderer>
      );
    });

    expect(renderer.toJSON()).toEqual([
      'initialOne',
      '22',
      'child1',
      '4',
      'content',
    ]);

    // And finally, navigate back to Parent.

    act(() => {
      renderer = create(
        <LayoutRenderer
          layout={Parent}
          layoutProps={{ two: 2 }}
          initialProps={undefined}
          errorComponent={ErrorComponent}
          loadingComponent={LoadingComponent}
        >
          content
        </LayoutRenderer>
      );
    });

    expect(renderer.toJSON()).toEqual(['initialOne', '2', 'content']);
  });

  test('with getInitialProps and useInitialProps', async () => {
    const Parent = makeLayout({
      component: ParentLayout,
      getInitialProps: async () => ({
        one: 'initialOne',
        two: 2,
      }),
    });

    const Child1 = makeLayout({
      component: ChildLayout,
      parent: Parent,
      useParentProps: (props) => ({
        two: 22,
      }),
      useInitialProps: () => {
        const result = useSWR(
          'layoutWithGetInitialPropsAndUseInitialProps:child1',
          async () => {
            await sleep(100);
            return 'child';
          }
        );

        return {
          data: {
            three: result.data,
            four: 4,
          },
          loading: !result.data,
        };
      },
    });

    let renderer: ReactTestRenderer = null as any;

    await act(async () => {
      renderer = create(
        <LayoutRenderer
          layout={Child1}
          layoutProps={{}}
          initialProps={await fetchGetInitialProps(Child1, mockPageContext)}
          errorComponent={ErrorComponent}
          loadingComponent={LoadingComponent}
        >
          content
        </LayoutRenderer>
      );
    });

    expect(renderer.toJSON()).toEqual(['initialOne', '22', 'loading']);

    await act(async () => {
      jest.runAllTimers();
    });

    expect(renderer.toJSON()).toEqual([
      'initialOne',
      '22',
      'child',
      '4',
      'content',
    ]);
  });
});
