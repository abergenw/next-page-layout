import React, {
  ComponentType,
  ReactElement,
  ReactNode,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  InitialProps,
  isServerLayout,
  Layout,
  LayoutInitialPropsStack,
  LayoutProps,
  useLayoutInitialProps,
  wrapError,
} from './layout';

interface Props<TLayout extends Layout<any, any, any>> {
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

export function LayoutRenderer<TLayout extends Layout<any, any, any>>(
  props: Props<TLayout>
) {
  const [clientSideInitialProps, setClientSideInitialProps] =
    useState<LayoutInitialPropsStack<TLayout>>();

  const [resolvedLayoutProps, setResolvedLayoutProps] = useState<
    InitialProps<any>[]
  >([]);

  useLayoutEffect(() => {
    lastLayoutRef.current = props.layout;
  }, [props.layout]);

  const resolveClientSideInitialProps = useCallback(
    (clientSideInitialProps: LayoutInitialPropsStack<TLayout>) => {
      setClientSideInitialProps(clientSideInitialProps);
    },
    []
  );

  const resolveLayoutProps = useCallback((layoutProps: InitialProps<any>[]) => {
    setResolvedLayoutProps(layoutProps);
  }, []);

  // Only render LayoutResolver once for each layout to avoid infinite recursion when props are resolved.
  const layoutResolver = useMemo(() => {
    return (
      <LayoutResolver
        {...props}
        key={props.layout.key}
        resolveClientSideInitialProps={resolveClientSideInitialProps}
        resolveLayoutProps={resolveLayoutProps}
      />
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.layout]);

  const renderLayout = () => {
    if (resolvedLayoutProps.length > 0 && clientSideInitialProps) {
      return (
        <RecursiveLayout
          {...props}
          layoutIndex={0}
          clientSideInitialProps={clientSideInitialProps}
          resolvedLayoutProps={resolvedLayoutProps}
        >
          {props.children}
        </RecursiveLayout>
      );
    }
  };

  const lastLayoutRef = useRef<typeof props.layout>(props.layout);
  const renderedLayoutRef = useRef<ReactElement>();

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

interface LayoutResolverProps<TLayout extends Layout<any, any, any>>
  extends Props<TLayout> {
  resolveLayoutProps: (layoutProps: InitialProps<any>[]) => void;
  resolveClientSideInitialProps: (
    clientSideInitialProps: LayoutInitialPropsStack<TLayout>
  ) => void;
}

function LayoutResolver<TLayout extends Layout<any, any, any>>(
  props: LayoutResolverProps<TLayout>
) {
  const clientSideInitialProps = useLayoutInitialProps(props.layout);

  const resolvedLayoutPropsRef = useRef<InitialProps<any>[]>([]);
  // Layout props are re-resolved after each render, clear current stack.
  resolvedLayoutPropsRef.current = [];

  const resolveLayoutProps = useCallback(
    (layoutProps: InitialProps<LayoutProps<TLayout>>) => {
      resolvedLayoutPropsRef.current.unshift(layoutProps);
    },
    []
  );

  useLayoutEffect(() => {
    props.resolveLayoutProps(resolvedLayoutPropsRef.current);
  });

  const { resolveClientSideInitialProps } = props;
  useLayoutEffect(() => {
    resolveClientSideInitialProps(clientSideInitialProps);
  }, [resolveClientSideInitialProps, clientSideInitialProps]);

  return (
    <RecursiveLayoutResolver
      {...props}
      resolveLayoutProps={resolveLayoutProps}
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
  resolveLayoutProps: (layoutProps: InitialProps<LayoutProps<TLayout>>) => void;
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

  // Re-resolving layout props after each render (thus props as deps).
  useLayoutEffect(() => {
    props.resolveLayoutProps(props.layoutProps);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only resolve once.
  }, [props]);

  interface RequireInitialProps extends InitialProps<any> {
    _isInitialProps: true;
  }

  const isInitialProps = (result: any): result is InitialProps<any> =>
    (result as RequireInitialProps)._isInitialProps;

  const makeRequire = <T,>(
    initialProps: InitialProps<T>
  ): ((callback: (data: T) => any) => any) => {
    return (callback) => {
      const data =
        initialProps.data !== undefined
          ? callback(initialProps.data)
          : undefined;

      return {
        data:
          initialProps.data !== undefined
            ? callback(initialProps.data)
            : undefined,
        loading: initialProps.loading,
        error:
          initialProps.error ?? data === undefined
            ? new RequireParentPropsError()
            : undefined,
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

interface RecursiveLayoutProps<TLayout extends Layout<any, any, any>>
  extends Omit<Props<TLayout>, 'layoutProps'> {
  layoutIndex: number;
  clientSideInitialProps: LayoutInitialPropsStack<TLayout>;
  resolvedLayoutProps: InitialProps<LayoutProps<TLayout>>[];
}

function RecursiveLayout<TLayout extends Layout<any, any, any>>(
  props: RecursiveLayoutProps<TLayout>
) {
  const initialProps = resolveInitialProps(props);

  const renderedLayoutRef =
    useRef<{ content: ReactElement; layoutKey: string }>();

  const layoutProps = props.resolvedLayoutProps[props.layoutIndex];

  let content;
  if (initialProps.loading || layoutProps.loading) {
    const LoadingComponent =
      (!isServerLayout(props.layout)
        ? props.layout.loadingComponent
        : undefined) ?? props.loadingComponent;

    content =
      (renderedLayoutRef.current?.layoutKey === props.layout.key
        ? renderedLayoutRef.current?.content
        : undefined) ?? (LoadingComponent ? <LoadingComponent /> : null);
  } else if (initialProps.error || layoutProps.error) {
    renderedLayoutRef.current = undefined;

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

    renderedLayoutRef.current = { content, layoutKey: props.layout.key };
  }

  if (props.layout.parent) {
    return (
      <RecursiveLayout
        {...props}
        layout={props.layout.parent}
        layoutIndex={props.layoutIndex + 1}
      >
        {content}
      </RecursiveLayout>
    );
  }

  return content;
}
