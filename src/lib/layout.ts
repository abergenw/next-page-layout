import { ComponentType, createElement, ReactNode } from 'react';
import { NextPageContext } from 'next';

export interface LayoutBaseProps {
  // Children should always be supplied in layouts, but loosening this since pages are also layouts.
  children?: ReactNode;
}

interface BaseLayoutParams<
  TProps extends LayoutBaseProps,
  TInitialProps extends Partial<TProps>,
  TParent extends Layout<any, any, any, any> | undefined,
  TParentProps
> {
  parent?: TParent;
  useParentProps?: (props: TProps) => TParentProps;
}

interface ServerSideLayoutParams<
  TProps extends LayoutBaseProps,
  TInitialProps extends Partial<TProps>,
  TParent extends Layout<any, any, any, any> | undefined,
  TParentProps
> extends BaseLayoutParams<TProps, TInitialProps, TParent, TParentProps> {
  getInitialProps?: (context: NextPageContext) => Promise<TInitialProps>;
}

interface ClientSideLayoutParams<
  TProps extends LayoutBaseProps,
  TInitialProps extends Partial<TProps>,
  TParent extends Layout<any, any, any, any> | undefined,
  TParentProps
> extends BaseLayoutParams<TProps, TInitialProps, TParent, TParentProps> {
  useInitialProps: () => InitialProps<TInitialProps>;
  loadingComponent?: ComponentType;
}

export type ServerSideLayout<
  TProps extends LayoutBaseProps,
  TInitialProps extends Partial<TProps>,
  TParent extends Layout<any, any, any, any> | undefined,
  TParentProps
> = ServerSideLayoutParams<TProps, TInitialProps, TParent, TParentProps> &
  ComponentType<TProps> & {
    // Unique key generated to identify the layout - needed e.g. in LayoutRenderer.
    key: string;
    isLayout: true;
  };

export type ClientSideLayout<
  TProps extends LayoutBaseProps,
  TInitialProps extends Partial<TProps>,
  TParent extends Layout<any, any, any, any> | undefined,
  TParentProps
> = ClientSideLayoutParams<TProps, TInitialProps, TParent, TParentProps> &
  ComponentType<TProps> & {
    key: string;
    isLayout: true;
  };

export type Layout<
  TProps extends LayoutBaseProps,
  TInitialProps extends Partial<TProps>,
  TParent extends Layout<any, any, any, any> | undefined,
  TParentProps
> =
  | ServerSideLayout<TProps, TInitialProps, TParent, TParentProps>
  | (ClientSideLayout<TProps, TInitialProps, TParent, TParentProps> & {
      isLayout: true;
    });

export const isServerSideLayout = <
  TProps extends LayoutBaseProps,
  TInitialProps extends Partial<TProps>,
  TParent extends Layout<any, any, any, any> | undefined,
  TParentProps
>(
  layout: Layout<TProps, TInitialProps, TParent, TParentProps>
): layout is ServerSideLayout<TProps, TInitialProps, TParent, TParentProps> => {
  return !(layout as ClientSideLayout<any, any, any, any>).useInitialProps;
};

interface MakeServerSideLayoutParams<
  TProps extends LayoutBaseProps,
  TInitialProps extends Partial<TProps>,
  TParent extends Layout<any, any, any, any> | undefined,
  TParentProps extends Partial<LayoutProps<TParent>>
> extends ServerSideLayoutParams<TProps, TInitialProps, TParent, TParentProps> {
  component: ComponentType<TProps>;
}

interface MakeClientSideLayoutParams<
  TProps extends LayoutBaseProps,
  TInitialProps extends Partial<TProps>,
  TParent extends Layout<any, any, any, any> | undefined,
  TParentProps extends Partial<LayoutProps<TParent>>
> extends ClientSideLayoutParams<TProps, TInitialProps, TParent, TParentProps> {
  component: ComponentType<TProps>;
}

type MakeLayoutParams<
  TProps extends LayoutBaseProps,
  TInitialProps extends Partial<TProps>,
  TParent extends Layout<any, any, any, any> | undefined,
  TParentProps extends Partial<LayoutProps<TParent>>
> =
  | MakeServerSideLayoutParams<TProps, TInitialProps, TParent, TParentProps>
  | MakeClientSideLayoutParams<TProps, TInitialProps, TParent, TParentProps>;

const isMakeServerSideLayoutParams = <
  TProps extends LayoutBaseProps,
  TInitialProps extends Partial<TProps>,
  TParent extends Layout<any, any, any, any> | undefined,
  TParentProps extends Partial<LayoutProps<TParent>>
>(
  params: MakeLayoutParams<TProps, TInitialProps, TParent, TParentProps>
): params is MakeServerSideLayoutParams<
  TProps,
  TInitialProps,
  TParent,
  TParentProps
> => {
  return !(params as MakeClientSideLayoutParams<any, any, any, any>)
    .useInitialProps;
};

let keyCount = 0;

export const makeLayout = <
  TProps extends LayoutBaseProps,
  TInitialProps extends Partial<TProps> = object,
  TParent extends Layout<any, any, any, any> | undefined = undefined,
  TParentProps extends Partial<LayoutProps<TParent>> = never
>(
  params: MakeLayoutParams<TProps, TInitialProps, TParent, TParentProps>
): Layout<TProps, TInitialProps, TParent, TParentProps> => {
  keyCount++;

  const layout: Layout<TProps, TInitialProps, TParent, TParentProps> = (
    props
  ) => {
    return createElement(params.component, props);
  };
  layout.isLayout = true;
  layout.key = `${layout.displayName}:${keyCount}`;
  layout.parent = params.parent;
  layout.useParentProps = params.useParentProps;

  if (isMakeServerSideLayoutParams(params)) {
    (
      layout as ServerSideLayout<TProps, TInitialProps, TParent, TParentProps>
    ).getInitialProps = params.getInitialProps;
  } else {
    (
      layout as ClientSideLayout<TProps, TInitialProps, TParent, TParentProps>
    ).useInitialProps = params.useInitialProps;
  }

  return layout;
};

export type LayoutParentProps<
  TLayout extends Layout<any, any, any, any> | undefined
> = TLayout extends Layout<
  infer TProps,
  infer TInitialProps,
  infer TParent,
  infer TParentProps
>
  ? TParentProps
  : never;

type Recursion = [never, 0, 1, 2, 3, 4, 5];

export type LayoutProps<
  TLayout extends Layout<any, any, any, any> | undefined,
  TRecursion extends number = 6
> = [TRecursion] extends [0]
  ? never
  : TLayout extends Layout<
      infer TProps,
      infer TInitialProps,
      infer TParent,
      infer TParentProps
    >
  ? Omit<
      TProps,
      (TInitialProps extends never ? never : keyof TInitialProps) | 'children'
    > &
      Omit<
        TParent extends undefined
          ? object
          : LayoutProps<TParent, Recursion[TRecursion]>,
        (TParentProps extends never ? never : keyof TParentProps) | 'children'
      > &
      Partial<TProps>
  : never;

export type InitialProps<TInitialProps> = {
  data: TInitialProps | undefined;
  loading?: boolean;
  error?: Error;
};

export type LayoutInitialProps<
  TLayout extends Layout<any, any, any, any> | undefined
> = TLayout extends Layout<
  infer TProps,
  infer TInitialProps,
  infer TParent,
  infer TParentProps
>
  ? InitialProps<TInitialProps>
  : never;

export type LayoutInitialPropsStack<
  TLayout extends Layout<any, any, any, any> | undefined,
  TRecursion extends number = 6
> = [TRecursion] extends [0]
  ? []
  : TLayout extends Layout<
      infer TProps,
      infer TInitialProps,
      infer TParent,
      infer TParentProps
    >
  ? [
      LayoutInitialProps<TLayout>,
      ...LayoutInitialPropsStack<TParent, Recursion[TRecursion]>
    ]
  : [];

export const layoutHasGetInitialProps = <
  TLayout extends Layout<any, any, any, any> | undefined
>(
  layout: TLayout
): boolean => {
  let hasInitialProps = false;
  let loopLayout = layout;
  while (!!loopLayout) {
    if (isServerSideLayout(loopLayout) && loopLayout.getInitialProps) {
      hasInitialProps = true;
      break;
    }
    loopLayout = loopLayout.parent;
  }
  return hasInitialProps;
};

export const fetchGetInitialProps = async <
  TLayout extends Layout<any, any, any, any> | undefined
>(
  layout: TLayout,
  context: NextPageContext
): Promise<LayoutInitialPropsStack<TLayout>> => {
  const promises: Promise<any>[] = [];

  let loopLayout = layout;
  while (!!loopLayout) {
    promises.push(
      isServerSideLayout(loopLayout) && loopLayout.getInitialProps
        ? loopLayout.getInitialProps(context)
        : Promise.resolve({})
    );
    loopLayout = loopLayout.parent;
  }

  const result = await Promise.allSettled(promises);
  return result.map((promise) => {
    if (promise.status === 'fulfilled') {
      return {
        data: promise.value,
      };
    }
    return {
      error: wrapError(promise.reason),
    };
  }) as LayoutInitialPropsStack<TLayout>;
};

export const useLayoutInitialProps = <
  TLayout extends Layout<any, any, any, any> | undefined
>(
  layout: TLayout
): LayoutInitialPropsStack<TLayout> => {
  const initialProps: any[] = [];
  let loopLayout = layout;
  while (!!loopLayout) {
    initialProps.push(
      !isServerSideLayout(loopLayout) && loopLayout.useInitialProps
        ? loopLayout.useInitialProps()
        : {}
    );
    loopLayout = loopLayout.parent;
  }
  return initialProps as LayoutInitialPropsStack<TLayout>;
};

export const isLayout = (
  component: ComponentType<any>
): component is Layout<any, any, any, any> => {
  return 'isLayout' in component;
};

// TODO: This is not a safe way to ensure Error.
export const wrapError = (e: unknown): Error =>
  e instanceof Error ? e : new Error('' + e);
