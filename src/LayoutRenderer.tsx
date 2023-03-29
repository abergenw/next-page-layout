import React, { ComponentType, ReactNode, useMemo, useRef } from 'react';
import {
  InitialProps,
  isClientLayout,
  Layout,
  LayoutInitialPropsStack,
  LayoutProps,
  useLayoutInitialProps,
  wrapError,
} from './layout';
import {
  LayoutPropsProvider,
  useLayoutProps,
  useLayoutPropsResolver,
} from './LayoutPropsProvider';
import useIsomorphicLayoutEffect from './useIsomorphicLayoutEffect';
import { useRouter } from 'next/router';

interface Props<TLayout> {
  layout: TLayout;
  layoutProps: LayoutProps<TLayout>;
  initialProps: LayoutInitialPropsStack<TLayout> | undefined;
  errorComponent?: ComponentType<ErrorComponentProps>;
  loadingComponent?: ComponentType;
  children?: ReactNode;
}

export interface ErrorComponentProps {
  error?: Error;
}

export class RequireParentPropsError extends Error {
  constructor() {
    super(
      'Missing required parent props. Seems like you called any of the require functions in useParentProps and the props are missing.'
    );
  }
}

export function LayoutRenderer<TLayout>(props: Props<TLayout>) {
  const router = useRouter();
  // router is null while testing.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const resolveMemoKey = useMemo(
    () => `${(props.layout as Layout<any, any, any>).key}:${router?.asPath}`,
    [props.layout, router?.asPath]
  );

  return (
    <LayoutPropsProvider resolveMemoKey={resolveMemoKey}>
      <_LayoutRenderer {...props} resolveMemoKey={resolveMemoKey} />
    </LayoutPropsProvider>
  );
}

function _LayoutRenderer<TLayout extends Layout<any, any, any>>(
  props: Props<TLayout> & {
    resolveMemoKey: string;
  }
) {
  const { resolvedLayoutProps, clientSideInitialProps } = useLayoutProps();

  const renderCache = useRef<(LayoutRenderCache<TLayout> | undefined)[]>([]);

  const layoutDepth = useMemo(() => {
    let depth = 1;
    let layout = props.layout;
    while (layout.parent) {
      depth++;
      layout = layout.parent;
    }

    renderCache.current.splice(depth);
    return depth;
  }, [props.layout]);

  useIsomorphicLayoutEffect(() => {
    lastLayoutRef.current = props.layout;
  }, [props.layout]);

  // Only render LayoutResolver once for each layout to avoid infinite recursion when props are resolved.
  const layoutResolver = useMemo(() => {
    return <LayoutResolver {...props} key={props.resolveMemoKey} />;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.resolveMemoKey]);

  const renderLayout = () => {
    if (resolvedLayoutProps && clientSideInitialProps) {
      return renderRecursiveLayouts({
        ...props,
        layoutDepthIndex: layoutDepth - 1,
        layoutIndex: 0,
        renderCache: renderCache.current,
        clientSideInitialProps: clientSideInitialProps as any,
        resolvedLayoutProps: resolvedLayoutProps,
      });
    }
  };

  const lastLayoutRef = useRef<typeof props.layout>(props.layout);
  const renderedLayoutRef = useRef<ReactNode>();

  // No point re-rendering actual layout if it hasn't changed.
  if (lastLayoutRef.current === props.layout) {
    renderedLayoutRef.current = renderLayout();
  }

  return (
    <>
      {renderedLayoutRef.current}
      {layoutResolver}
    </>
  );
}

function LayoutResolver<TLayout extends Layout<any, any, any>>(
  props: Props<TLayout>
) {
  const clientSideInitialProps = useLayoutInitialProps(props.layout);

  const { resolveClientSideInitialProps, onResolveComplete } =
    useLayoutPropsResolver();
  resolveClientSideInitialProps(clientSideInitialProps as any);
  useIsomorphicLayoutEffect(() => {
    onResolveComplete();
  });

  return (
    <RecursiveLayoutResolver
      {...props}
      layoutProps={{ data: props.layoutProps }}
      layoutIndex={0}
      clientSideInitialProps={clientSideInitialProps}
    >
      {props.children}
    </RecursiveLayoutResolver>
  );
}

interface RecursiveLayoutResolverProps<TLayout extends Layout<any, any, any>>
  extends Omit<Props<TLayout>, 'layoutProps'> {
  layoutIndex: number;
  clientSideInitialProps: LayoutInitialPropsStack<TLayout>;
  layoutProps: InitialProps<LayoutProps<TLayout>>;
}

const resolveInitialProps = (props: {
  layoutIndex: number;
  clientSideInitialProps: LayoutInitialPropsStack<any>;
  initialProps: LayoutInitialPropsStack<any> | undefined;
}): InitialProps<any> => {
  const initialProps: any = {
    ...props.initialProps?.[props.layoutIndex],
    ...props.clientSideInitialProps?.[props.layoutIndex],
  };
  // data is missing if no initialProps are defined. This prevents upstream layouts from rendering if any of the require functions are used in useParentProps.
  if (!('data' in initialProps)) {
    initialProps.data = {};
  }
  return initialProps;
};

function RecursiveLayoutResolver<TLayout extends Layout<any, any, any>>(
  props: RecursiveLayoutResolverProps<TLayout>
) {
  // TODO: Fix all this "any" crap.

  const initialProps = resolveInitialProps(props);

  const { resolveLayoutProps, resolveRenderLayoutProps } =
    useLayoutPropsResolver();

  // Resolving props twice, once during render pass and once after mount.
  resolveRenderLayoutProps(props.layoutProps);
  useIsomorphicLayoutEffect(() => {
    resolveLayoutProps(props.layoutProps);
  });

  type RequireInitialProps = InitialProps<any> & {
    _isInitialProps: true;
  };

  const isInitialProps = (result: any): result is InitialProps<any> =>
    (result as RequireInitialProps)._isInitialProps;

  const makeRequire = <T,>(
    requireProps: InitialProps<T>
  ): ((callback: (data: T) => any) => any) => {
    return (callback) => {
      const data =
        requireProps.data !== undefined
          ? callback(requireProps.data)
          : undefined;

      return {
        data:
          requireProps.data !== undefined
            ? callback(requireProps.data)
            : undefined,
        loading: requireProps.loading,
        error:
          requireProps.error ??
          (data === undefined ? new RequireParentPropsError() : undefined),
        _isInitialProps: true,
      };
    };
  };

  const requireInitialProps = makeRequire(initialProps);
  const requireLayoutProps = makeRequire(props.layoutProps);
  const requireProps = makeRequire({
    data:
      initialProps.data !== undefined && props.layoutProps.data !== undefined
        ? {
            initialProps: initialProps.data,
            layoutProps: props.layoutProps.data,
          }
        : undefined,
    loading: initialProps.loading || props.layoutProps.loading,
    error: initialProps.error ?? props.layoutProps.error,
  });

  let parentProps: any;

  try {
    const resolvedParentProps = props.layout.useParentProps({
      initialProps,
      layoutProps: props.layoutProps,
      requireInitialProps,
      requireLayoutProps,
      requireProps,
    });

    parentProps = isInitialProps(resolvedParentProps)
      ? resolvedParentProps
      : { data: resolvedParentProps };
  } catch (e: unknown) {
    parentProps = { data: undefined, error: wrapError(e) };
  }

  return props.layout.parent ? (
    <RecursiveLayoutResolver
      {...props}
      layout={props.layout.parent}
      layoutProps={parentProps}
      layoutIndex={props.layoutIndex + 1}
    />
  ) : null;
}

interface LayoutRenderCache<TLayout extends Layout<any, any, any>> {
  layout: TLayout;
  layoutProps: any;
}

interface RenderRecursiveLayoutsProps<TLayout extends Layout<any, any, any>>
  extends Omit<Props<TLayout>, 'layoutProps'> {
  layoutIndex: number;
  layoutDepthIndex: number;
  renderCache: (LayoutRenderCache<TLayout> | undefined)[];
  clientSideInitialProps: LayoutInitialPropsStack<TLayout>;
  resolvedLayoutProps: InitialProps<LayoutProps<TLayout>>[];
}

const renderRecursiveLayouts = <TLayout extends Layout<any, any, any>>(
  props: RenderRecursiveLayoutsProps<TLayout>
): ReactNode => {
  const initialProps = resolveInitialProps(props);

  if (
    props.renderCache[props.layoutDepthIndex] &&
    props.renderCache[props.layoutDepthIndex]?.layout !== props.layout
  ) {
    props.renderCache[props.layoutDepthIndex] = undefined;
  }

  const layoutProps = props.resolvedLayoutProps[props.layoutIndex];

  let content;
  if (initialProps.loading || layoutProps.loading) {
    if (props.renderCache[props.layoutDepthIndex]) {
      content = (
        <props.layout
          key={props.layout.key}
          {...props.renderCache[props.layoutDepthIndex]?.layoutProps}
        >
          {props.children}
        </props.layout>
      );
    } else {
      const LoadingComponent =
        (isClientLayout(props.layout)
          ? props.layout.loadingComponent
          : undefined) ?? props.loadingComponent;

      content = LoadingComponent ? <LoadingComponent /> : null;
    }
  } else if (initialProps.error || layoutProps.error) {
    props.renderCache[props.layoutDepthIndex] = undefined;

    content = (
      <>
        {props.errorComponent ? (
          <props.errorComponent
            error={initialProps?.error ?? layoutProps.error ?? new Error()}
          />
        ) : null}
      </>
    );
  } else {
    const finalLayoutProps = { ...initialProps.data, ...layoutProps.data };

    content = (
      <props.layout key={props.layout.key} {...finalLayoutProps}>
        {props.children}
      </props.layout>
    );

    props.renderCache[props.layoutDepthIndex] = {
      layout: props.layout,
      layoutProps: finalLayoutProps,
    };
  }

  if (props.layout.parent) {
    return renderRecursiveLayouts({
      ...props,
      layout: props.layout.parent,
      layoutIndex: props.layoutIndex + 1,
      layoutDepthIndex: props.layoutDepthIndex - 1,
      children: content,
    });
  }

  return content;
};
