import { ComponentType, createElement, ReactNode } from 'react';
import { NextPageContext } from 'next';

export interface LayoutBaseProps {
  // Children should always be supplied in layouts, but loosening this since pages are also layouts.
  children?: ReactNode;
}

interface BaseLayoutParams<
  TProps extends LayoutBaseProps,
  TInitialProps extends Partial<TProps>,
  TParent extends Layout<any, any, any> | undefined
> {
  parent?: TParent;
  useParentProps: (props: TProps) => LayoutProps<TParent>;
}

interface ServerSideLayoutParams<
  TProps extends LayoutBaseProps,
  TInitialProps extends Partial<TProps>,
  TParent extends Layout<any, any, any> | undefined
> extends BaseLayoutParams<TProps, TInitialProps, TParent> {
  getInitialProps?: (context: NextPageContext) => Promise<TInitialProps>;
}

interface ClientSideLayoutParams<
  TProps extends LayoutBaseProps,
  TInitialProps extends Partial<TProps>,
  TParent extends Layout<any, any, any> | undefined
> extends BaseLayoutParams<TProps, TInitialProps, TParent> {
  useInitialProps: () => InitialProps<TInitialProps>;
  loadingComponent?: ComponentType;
}

export type ServerSideLayout<
  TProps extends LayoutBaseProps,
  TInitialProps extends Partial<TProps>,
  TParent extends Layout<any, any, any> | undefined
> = ServerSideLayoutParams<TProps, TInitialProps, TParent> &
  ComponentType<TProps> & {
    // Unique key generated to identify the layout - needed e.g. in LayoutRenderer.
    key: string;
    isLayout: true;
  };

export type ClientSideLayout<
  TProps extends LayoutBaseProps,
  TInitialProps extends Partial<TProps>,
  TParent extends Layout<any, any, any> | undefined
> = ClientSideLayoutParams<TProps, TInitialProps, TParent> &
  ComponentType<TProps> & {
    key: string;
    isLayout: true;
  };

export type Layout<
  TProps extends LayoutBaseProps,
  TInitialProps extends Partial<TProps>,
  TParent extends Layout<any, any, any> | undefined
> =
  | ServerSideLayout<TProps, TInitialProps, TParent>
  | (ClientSideLayout<TProps, TInitialProps, TParent> & {
      isLayout: true;
    });

export const isServerSideLayout = <
  TProps extends LayoutBaseProps,
  TInitialProps extends Partial<TProps>,
  TParent extends Layout<any, any, any> | undefined
>(
  layout: Layout<TProps, TInitialProps, TParent>
): layout is ServerSideLayout<TProps, TInitialProps, TParent> => {
  return !(layout as ClientSideLayout<any, any, any>).useInitialProps;
};

interface MakeServerSideLayoutParams<
  TProps extends LayoutBaseProps,
  TInitialProps extends Partial<TProps>,
  TParent extends Layout<any, any, any> | undefined
> extends ServerSideLayoutParams<TProps, TInitialProps, TParent> {
  component: ComponentType<TProps>;
}

interface MakeClientSideLayoutParams<
  TProps extends LayoutBaseProps,
  TInitialProps extends Partial<TProps>,
  TParent extends Layout<any, any, any> | undefined
> extends ClientSideLayoutParams<TProps, TInitialProps, TParent> {
  component: ComponentType<TProps>;
}

type MakeLayoutParams<
  TProps extends LayoutBaseProps,
  TInitialProps extends Partial<TProps>,
  TParent extends Layout<any, any, any> | undefined
> =
  | MakeServerSideLayoutParams<TProps, TInitialProps, TParent>
  | MakeClientSideLayoutParams<TProps, TInitialProps, TParent>;

const isMakeServerSideLayoutParams = <
  TProps extends LayoutBaseProps,
  TInitialProps extends Partial<TProps>,
  TParent extends Layout<any, any, any> | undefined
>(
  params: MakeLayoutParams<TProps, TInitialProps, TParent>
): params is MakeServerSideLayoutParams<TProps, TInitialProps, TParent> => {
  return !(params as MakeClientSideLayoutParams<any, any, any>).useInitialProps;
};

let keyCount = 0;

export const makeLayout = <
  TProps extends LayoutBaseProps,
  TInitialProps extends Partial<TProps> = object,
  TParent extends Layout<any, any, any> | undefined = undefined
>(
  params: MakeLayoutParams<TProps, TInitialProps, TParent>
): Layout<TProps, TInitialProps, TParent> => {
  keyCount++;

  const layout: Layout<TProps, TInitialProps, TParent> = (props) => {
    return createElement(params.component, props);
  };
  layout.isLayout = true;
  layout.key = `${layout.displayName}:${keyCount}`;
  layout.parent = params.parent;
  layout.useParentProps = params.useParentProps;

  if (isMakeServerSideLayoutParams(params)) {
    (
      layout as ServerSideLayout<TProps, TInitialProps, TParent>
    ).getInitialProps = params.getInitialProps;
  } else {
    (
      layout as ClientSideLayout<TProps, TInitialProps, TParent>
    ).useInitialProps = params.useInitialProps;
  }

  return layout;
};

export type LayoutParent<TLayout extends Layout<any, any, any> | undefined> =
  TLayout extends Layout<any, any, infer TParent> ? TParent : never;

export type LayoutProps<TLayout extends Layout<any, any, any> | undefined> =
  TLayout extends Layout<infer TProps, infer TInitialProps, any>
    ? LayoutSelfProps<TProps, TInitialProps>
    : Record<string, never>;

type LayoutSelfProps<TProps, TInitialProps extends Partial<TProps>> = Omit<
  TProps,
  (TInitialProps extends never ? never : keyof TInitialProps) | 'children'
>;

export type InitialProps<TInitialProps> = {
  data: TInitialProps | undefined;
  loading?: boolean;
  error?: Error;
};

export type LayoutInitialProps<
  TLayout extends Layout<any, any, any> | undefined
> = TLayout extends Layout<any, infer TInitialProps, any>
  ? InitialProps<TInitialProps>
  : never;

type Recursion = [never, 0, 1, 2, 3, 4, 5];

export type LayoutInitialPropsStack<
  TLayout extends Layout<any, any, any> | undefined,
  TRecursion extends number = 6
> = [TRecursion] extends [0]
  ? []
  : TLayout extends Layout<infer TProps, infer TInitialProps, infer TParent>
  ? [
      LayoutInitialProps<TLayout>,
      ...LayoutInitialPropsStack<TParent, Recursion[TRecursion]>
    ]
  : [];

export const layoutHasGetInitialProps = <
  TLayout extends Layout<any, any, any> | undefined
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
  TLayout extends Layout<any, any, any> | undefined
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
  TLayout extends Layout<any, any, any> | undefined
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
): component is Layout<any, any, any> => {
  return 'isLayout' in component;
};

// TODO: This is not a safe way to ensure Error.
export const wrapError = (e: unknown): Error =>
  e instanceof Error ? e : new Error('' + e);
