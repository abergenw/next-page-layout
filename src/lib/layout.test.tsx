import React, { useEffect, useLayoutEffect, useState } from 'react';
import { fetchGetInitialProps, makeLayout } from './layout';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { LayoutRenderer } from './LayoutRenderer';
import {
  ChildLayout,
  ChildLayoutProps,
  EmptyLayout,
  ErrorComponent,
  GrandChildLayout,
  LoadingComponent,
  mockPageContext,
  ParentLayout,
  ParentLayoutProps,
  sleep,
} from './test-utils';
import useSWR from 'swr';

describe('layout', () => {
  test('with parent and child', async () => {
    const Parent = makeLayout(undefined, {
      component: ParentLayout,
      useParentProps: (props) => ({}),
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

    const Child = makeLayout(undefined, {
      component: ChildLayout,
      parent: Parent,
      useParentProps: (props) => ({
        one: 'one',
        two: 2,
      }),
    });

    const child = create(
      <LayoutRenderer
        layout={Child}
        layoutProps={{ three: 'three', four: 4 }}
        initialProps={await fetchGetInitialProps(Child, mockPageContext)}
      >
        content
      </LayoutRenderer>
    );
    expect(child.toJSON()).toEqual(['one', '2', 'three', '4', 'content']);

    const GrandChild = makeLayout(undefined, {
      component: GrandChildLayout,
      parent: Child,
      useParentProps: (props) => ({ three: 'three', four: 4 }),
    });

    const grandChild = create(
      <LayoutRenderer
        layout={GrandChild}
        layoutProps={{
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

  test('with parent and child, overriding parent props', async () => {
    const Parent = makeLayout(undefined, {
      component: ParentLayout,
      useParentProps: (props) => ({}),
    });

    const Child = makeLayout(undefined, {
      component: ChildLayout,
      parent: Parent,
      useParentProps: (props) =>
        props.requireLayoutProps((layoutProps) => ({
          one: layoutProps.one ?? 'one',
          two: 2,
        })),
    });

    const child = create(
      <LayoutRenderer
        layout={Child}
        layoutProps={{ one: 'overrideOne', three: 'three', four: 4 }}
        initialProps={await fetchGetInitialProps(Child, mockPageContext)}
      >
        content
      </LayoutRenderer>
    );
    expect(child.toJSON()).toEqual([
      'overrideOne',
      '2',
      'three',
      '4',
      'content',
    ]);

    const GrandChild = makeLayout(undefined, {
      component: GrandChildLayout,
      parent: Child,
      useParentProps: (props) =>
        props.requireLayoutProps((layoutProps) => ({
          one: layoutProps.one ?? 'one',
          three: layoutProps.three ?? 'three',
          four: 4,
        })),
    });

    const grandChild = create(
      <LayoutRenderer
        layout={GrandChild}
        layoutProps={{
          one: 'overrideOne',
          three: 'overrideThree',
          five: 'five',
        }}
        initialProps={await fetchGetInitialProps(GrandChild, mockPageContext)}
      >
        content
      </LayoutRenderer>
    );
    expect(grandChild.toJSON()).toEqual([
      'overrideOne',
      '2',
      'overrideThree',
      '4',
      'five',
      'content',
    ]);
  });

  test('with getInitialProps', async () => {
    const Parent = makeLayout(
      {
        getInitialProps: async (context) => ({
          one: 'initialOne',
        }),
      },
      {
        component: ParentLayout,
        useParentProps: (props) => ({}),
      }
    );

    const Child = makeLayout(
      {
        getInitialProps: async (context) => ({
          three: 'initialThree',
        }),
      },
      {
        component: ChildLayout,
        parent: Parent,
        useParentProps: (props) =>
          props.requireLayoutProps((layoutProps) => ({
            two: layoutProps.four,
          })),
      }
    );

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

    const GrandChild = makeLayout(
      {
        getInitialProps: async (context) => ({
          five: 'initialFive',
        }),
      },
      {
        component: GrandChildLayout,
        parent: Child,
        useParentProps: (props) => ({
          four: 4,
        }),
      }
    );

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

    const Parent = makeLayout(undefined, {
      component: function Component(props) {
        parentRenderedTimes++;
        useLayoutEffect(() => {
          parentMountedTimes++;
        }, []);
        return <>{props.children}</>;
      },
      useParentProps: (props) => ({}),
    });

    const Child1 = makeLayout(undefined, {
      component: EmptyLayout,
      parent: Parent,
      useParentProps: (props) => ({}),
    });

    const Child2 = makeLayout(undefined, {
      component: EmptyLayout,
      parent: Parent,
      useParentProps: (props) => ({}),
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
    const Parent = makeLayout(undefined, {
      component: EmptyLayout,
      useParentProps: (props) => ({}),
    });

    // Using hook in useParentProps.
    const Child1 = makeLayout(undefined, {
      component: EmptyLayout,
      parent: Parent,
      useParentProps: (props) => {
        useState(false);
        return {};
      },
    });

    // No hooks.
    const Child2 = makeLayout(undefined, {
      component: EmptyLayout,
      parent: Parent,
      useParentProps: (props) => ({}),
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
    const Parent = makeLayout(
      {
        useInitialProps: () => {
          const result = useSWR(
            'layoutWithUseInitialProps:parent',
            async () => {
              await sleep(100);
              return 'initialOne';
            }
          );

          return {
            data: {
              one: result.data,
            },
            loading: !result.data,
          };
        },
      },
      {
        component: ParentLayout,
        useParentProps: (props) => ({}),
      }
    );

    let renderer: ReactTestRenderer = null as any;

    void act(() => {
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

    const Child1 = makeLayout(
      {
        useInitialProps: () => {
          const result = useSWR(
            'layoutWithUseInitialProps:child1',
            async () => {
              await sleep(100);
              return 'child1';
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
      },
      {
        component: ChildLayout,
        parent: Parent,
        useParentProps: (props) => ({
          two: 22,
        }),
      }
    );

    void act(() => {
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

    const Child2 = makeLayout(
      {
        useInitialProps: () => {
          const result = useSWR(
            'layoutWithUseInitialProps:child2',
            async () => {
              await sleep(100);
              return 'child2';
            }
          );

          return {
            data: {
              three: result.data,
              four: 44,
            },
            loading: !result.data,
          };
        },
      },
      {
        component: ChildLayout,
        parent: Parent,
        useParentProps: (props) => ({
          two: 2222,
        }),
      }
    );

    void act(() => {
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

    void act(() => {
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

    void act(() => {
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
    const Parent = makeLayout(
      {
        getInitialProps: async () => ({
          one: 'initialOne',
          two: 2,
        }),
      },
      {
        component: ParentLayout,
        useParentProps: (props) => ({}),
      }
    );

    const Child1 = makeLayout(
      {
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
      },
      {
        component: ChildLayout,
        parent: Parent,
        useParentProps: (props) => ({
          two: 22,
        }),
      }
    );

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

  // useSWR data prop is undefined while loading, while useQuery in Apollo Client returns an empty object {}. Imitate both.
  const testUseInitialPropsAsParentProps = async (imitateApollo: boolean) => {
    const Parent = makeLayout(undefined, {
      component: ParentLayout,
      useParentProps: (props) => ({}),
    });

    const Child = makeLayout(undefined, {
      component: (props: ChildLayoutProps) => {
        expect(props.three).toBeDefined();
        expect(props.four).toBeDefined();
        return <ChildLayout {...props} />;
      },
      parent: Parent,
      useParentProps: (props) => ({ one: 'one', two: 2 }),
    });

    const GrandChild = makeLayout(
      {
        useInitialProps: () => {
          const result = useSWR(
            `layoutWithUseInitialPropsAsUseParentProps:${
              imitateApollo ? 'apollo' : 'swr'
            }`,
            async () => {
              await sleep(1000);
              return {
                three: 'initialThree',
                four: 4,
              };
            }
          );

          return {
            data: imitateApollo ? result.data ?? ({} as any) : result.data,
            loading: !result.data,
          };
        },
      },
      {
        component: (props: ChildLayoutProps) => {
          return <>{props.children}</>;
        },
        parent: Child,
        useParentProps: (props) => {
          return props.requireInitialProps((initialProps) => {
            return {
              three: initialProps.three,
              four: initialProps.four,
            };
          });
        },
      }
    );

    let renderer: ReactTestRenderer = null as any;

    void act(() => {
      renderer = create(
        <LayoutRenderer
          layout={GrandChild}
          layoutProps={{}}
          initialProps={undefined}
          errorComponent={ErrorComponent}
          loadingComponent={LoadingComponent}
        >
          content
        </LayoutRenderer>
      );
    });

    expect(renderer.toJSON()).toEqual(['one', '2', 'loading']);

    await act(async () => {
      jest.runAllTimers();
    });

    expect(renderer.toJSON()).toEqual([
      'one',
      '2',
      'initialThree',
      '4',
      'content',
    ]);
  };

  test('with useInitialProps as useParentProps', async () =>
    testUseInitialPropsAsParentProps(false));

  test('with useInitialProps as useParentProps (Apollo Client like)', async () =>
    testUseInitialPropsAsParentProps(true));

  test("doesn't re-render loading state", async () => {
    let count = 0;
    const Parent = makeLayout(
      {
        useInitialProps: () => {
          const [data, setData] =
            useState<Omit<ParentLayoutProps, 'children'>>();

          useEffect(() => {
            const fetchData = async () => {
              count++;
              await sleep(100);
              setData({ one: 'one', two: count });
              await sleep(100);
              setData(undefined);
              void fetchData();
            };

            void fetchData();
          }, []);

          return {
            data,
            loading: !data,
          };
        },
      },
      {
        component: ParentLayout,
        useParentProps: (props) => ({}),
      }
    );

    let renderer: ReactTestRenderer = null as any;

    void act(() => {
      renderer = create(
        <LayoutRenderer
          layout={Parent}
          layoutProps={{}}
          initialProps={undefined}
          errorComponent={ErrorComponent}
          loadingComponent={LoadingComponent}
        >
          content
        </LayoutRenderer>
      );
    });

    // Initially we are loading.
    expect(renderer.toJSON()).toEqual('loading');

    // Run timers to get data.
    await act(async () => {
      jest.runAllTimers();
    });
    expect(renderer.toJSON()).toEqual(['one', '1', 'content']);

    // Start reload but still expect old data to be visible.
    await act(async () => {
      jest.runAllTimers();
    });
    expect(renderer.toJSON()).toEqual(['one', '1', 'content']);

    // Reload finished, expect new data.
    await act(async () => {
      jest.runAllTimers();
    });
    expect(renderer.toJSON()).toEqual(['one', '2', 'content']);
  });
});
