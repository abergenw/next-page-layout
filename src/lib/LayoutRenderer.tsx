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
  isServerSideLayout,
  Layout,
  LayoutInitialPropsStack,
  LayoutParentProps,
  LayoutProps,
  useLayoutInitialProps,
  wrapError,
} from './layout';

interface Props<TLayout extends Layout<any, any, any, any>> {
  layout: TLayout;
  layoutProps: LayoutProps<TLayout>;
  initialProps: LayoutInitialPropsStack<TLayout> | undefined;
  errorComponent?: ComponentType<ErrorComponentProps>;
  loadingComponent?: ComponentType;
  children?: ReactNode;
}

export interface ErrorComponentProps {
  error: Error;
}

export function LayoutRenderer<TLayout extends Layout<any, any, any, any>>(
  props: Props<TLayout>
) {
  const [clientSideInitialProps, setClientSideInitialProps] =
    useState<LayoutInitialPropsStack<TLayout>>();

  const [resolvedLayoutProps, setResolvedLayoutProps] = useState<
    InitialProps<any>[]
  >([]);
  const resolvedLayoutPropsRef = useRef<InitialProps<any>[]>([]);

  useMemo(() => {
    resolvedLayoutPropsRef.current = [];
    // eslint-disable-next-line react-hooks/exhaustive-deps -- We only want to resolve layout props once for each layout stack.
  }, [props.layout]);

  useLayoutEffect(() => {
    setResolvedLayoutProps(resolvedLayoutPropsRef.current);
    lastLayoutRef.current = props.layout;
  }, [props.layout]);

  const resolveParentProps = useCallback(
    (parentProps: InitialProps<LayoutParentProps<TLayout>>) => {
      resolvedLayoutPropsRef.current.unshift(parentProps);
    },
    []
  );

  const resolveClientSideInitialProps = useCallback(
    (clientSideInitialProps: LayoutInitialPropsStack<TLayout>) => {
      setClientSideInitialProps(clientSideInitialProps);
    },
    []
  );

  // Only render LayoutResolver once for each layout to avoid infinite recursion when props are resolved.
  const layoutResolver = useMemo(() => {
    return (
      <LayoutResolver
        {...props}
        key={props.layout.key}
        resolveClientSideInitialProps={resolveClientSideInitialProps}
        resolveParentProps={resolveParentProps}
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
          mode="render"
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

interface RecursiveLayoutBaseProps<TLayout extends Layout<any, any, any, any>>
  extends Omit<Props<TLayout>, 'layoutProps'> {
  layoutIndex: number;
  clientSideInitialProps: LayoutInitialPropsStack<TLayout>;
}

interface RecursiveLayoutRenderProps<TLayout extends Layout<any, any, any, any>>
  extends RecursiveLayoutBaseProps<TLayout> {
  mode: 'render';
  resolvedLayoutProps: InitialProps<LayoutProps<TLayout>>[];
}

interface RecursiveLayoutResolveProps<
  TLayout extends Layout<any, any, any, any>
> extends RecursiveLayoutBaseProps<TLayout> {
  mode: 'resolve';
  layoutProps: LayoutProps<TLayout>;
  resolveParentProps: (
    parentProps: InitialProps<LayoutParentProps<TLayout>>
  ) => void;
}

type RecursiveLayoutProps<TLayout extends Layout<any, any, any, any>> =
  | RecursiveLayoutRenderProps<TLayout>
  | RecursiveLayoutResolveProps<TLayout>;

interface LayoutResolverProps<TLayout extends Layout<any, any, any, any>>
  extends Omit<
    RecursiveLayoutResolveProps<TLayout>,
    'mode' | 'clientSideInitialProps' | 'layoutIndex'
  > {
  resolveClientSideInitialProps: (
    clientSideInitialProps: LayoutInitialPropsStack<TLayout>
  ) => void;
}

function LayoutResolver<TLayout extends Layout<any, any, any, any>>(
  props: LayoutResolverProps<TLayout>
) {
  const clientSideInitialProps = useLayoutInitialProps(props.layout);

  const { resolveClientSideInitialProps } = props;
  useLayoutEffect(() => {
    resolveClientSideInitialProps(clientSideInitialProps);
  }, [resolveClientSideInitialProps, clientSideInitialProps]);

  return (
    <RecursiveLayout
      {...props}
      layoutIndex={0}
      clientSideInitialProps={clientSideInitialProps}
      mode="resolve"
    >
      {props.children}
    </RecursiveLayout>
  );
}

function RecursiveLayout<TLayout extends Layout<any, any, any, any>>(
  props: RecursiveLayoutProps<TLayout>
) {
  // Only one of these should be supplied so we can spread.
  const initialProps = {
    ...props.initialProps?.[props.layoutIndex],
    ...props.clientSideInitialProps?.[props.layoutIndex],
  };

  const renderedLayoutRef = useRef<ReactElement>();
  const parentPropsRef = useRef<InitialProps<LayoutParentProps<TLayout>>>();

  useLayoutEffect(() => {
    if (props.mode === 'resolve') {
      props.resolveParentProps(
        parentPropsRef.current as InitialProps<LayoutParentProps<TLayout>>
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only resolve once.
  }, []);

  if (props.mode === 'resolve') {
    const finalLayoutProps = {
      ...initialProps?.data,
      ...props.layoutProps,
    };

    let parentProps: any;

    try {
      parentProps = {
        ...props.layoutProps,
        ...props.layout.useParentProps?.(finalLayoutProps),
      };
      parentPropsRef.current = { data: parentProps };
    } catch (e: unknown) {
      parentProps = props.layoutProps;
      parentPropsRef.current = { data: undefined, error: wrapError(e) };
    }

    return props.layout.parent ? (
      <RecursiveLayout
        {...props}
        layout={props.layout.parent}
        layoutProps={parentProps}
        layoutIndex={props.layoutIndex + 1}
      />
    ) : null;
  }

  const layoutProps = props.resolvedLayoutProps[props.layoutIndex];

  let content;
  if (initialProps?.error || layoutProps.error) {
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
  } else if (initialProps?.loading) {
    const LoadingComponent =
      (!isServerSideLayout(props.layout)
        ? props.layout.loadingComponent
        : undefined) ?? props.loadingComponent;

    content =
      renderedLayoutRef.current ??
      (LoadingComponent ? <LoadingComponent /> : null);
  } else {
    const finalLayoutProps = { ...initialProps?.data, ...layoutProps.data };

    content = (
      <props.layout key={props.layout.key} {...finalLayoutProps}>
        {props.children}
      </props.layout>
    );
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
