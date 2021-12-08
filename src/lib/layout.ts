import { ComponentType, createElement, ReactNode } from 'react';
import { NextPageContext } from 'next';

export interface LayoutBaseProps {
  // Children should always be supplied in layouts, but loosening this since pages are also layouts.
  children?: ReactNode;
}

type BaseLayout<
  TProps extends LayoutBaseProps,
  TInitialProps extends Partial<TProps>,
  TParent extends Layout<any, any, any> | undefined
> = ComponentType<TProps> & {
  // Unique key generated to identify the layout - needed e.g. in LayoutRenderer.
  key: string;
  isLayout: true;
  parent?: TParent;
  useParentProps: (props: {
    initialProps: InitialProps<TInitialProps>;
    layoutProps: InitialProps<LayoutSelfProps<TProps, TInitialProps>>;
    // The require functions are escape hatches which allow you to pass a loading/error state to the parent while still preserving type safety and inference.
    // If you need initialProps (data loaded) or layoutProps (passed by downstream layout) resolved before rendering the parent layout, use these.
    requireInitialProps: (
      callback: (initialProps: TInitialProps) => LayoutProps<TParent>
    ) => any;
    requireLayoutProps: (
      callback: (
        layoutProps: LayoutSelfProps<TProps, TInitialProps>
      ) => LayoutProps<TParent>
    ) => any;
    requireProps: (
      callback: (props: {
        initialProps: TInitialProps;
        layoutProps: LayoutSelfProps<TProps, TInitialProps>;
      }) => LayoutProps<TParent>
    ) => any;
  }) => LayoutProps<TParent>;
};

export type ServerLayout<
  TProps extends LayoutBaseProps,
  TInitialProps extends Partial<TProps>,
  TParent extends Layout<any, any, any> | undefined
> = BaseLayout<TProps, TInitialProps, TParent> & {
  getInitialProps?: (context: NextPageContext) => Promise<TInitialProps>;
};

export type ClientLayout<
  TProps extends LayoutBaseProps,
  TInitialProps extends Partial<TProps>,
  TParent extends Layout<any, any, any> | undefined
> = BaseLayout<TProps, TInitialProps, TParent> & {
  useInitialProps: () => InitialProps<TInitialProps>;
  loadingComponent?: ComponentType;
};

export type Layout<
  TProps extends LayoutBaseProps,
  TInitialProps extends Partial<TProps>,
  TParent extends Layout<any, any, any> | undefined
> =
  | ServerLayout<TProps, TInitialProps, TParent>
  | ClientLayout<TProps, TInitialProps, TParent>;

export const isServerLayout = <
  TProps extends LayoutBaseProps,
  TInitialProps extends Partial<TProps>,
  TParent extends Layout<any, any, any> | undefined
>(
  layout: Layout<TProps, TInitialProps, TParent>
): layout is ServerLayout<TProps, TInitialProps, TParent> => {
  return !(layout as ClientLayout<any, any, any>).useInitialProps;
};

export type MakeServerLayoutInitialParams<TInitialProps> = Pick<
  ServerLayout<any, TInitialProps, any>,
  'getInitialProps'
>;

export type MakeClientLayoutInitialParams<TInitialProps> = Pick<
  ClientLayout<any, TInitialProps, any>,
  'useInitialProps'
>;

export type MakeLayoutInitialParams<TInitialProps> =
  | MakeServerLayoutInitialParams<TInitialProps>
  | MakeClientLayoutInitialParams<TInitialProps>;

type MakeServerLayoutParams<
  TProps extends LayoutBaseProps,
  TInitialProps extends Partial<TProps>,
  TParent extends Layout<any, any, any> | undefined
> = Omit<
  ServerLayout<TProps, TInitialProps, TParent>,
  'key' | 'isLayout' | 'getInitialProps'
> & {
  component: ComponentType<TProps>;
};

type MakeClientLayoutParams<
  TProps extends LayoutBaseProps,
  TInitialProps extends Partial<TProps>,
  TParent extends Layout<any, any, any> | undefined
> = Omit<
  ClientLayout<TProps, TInitialProps, TParent>,
  'key' | 'isLayout' | 'useInitialProps'
> & {
  component: ComponentType<TProps>;
};

type MakeLayoutParams<
  TProps extends LayoutBaseProps,
  TInitialProps extends Partial<TProps>,
  TParent extends Layout<any, any, any> | undefined
> =
  | MakeServerLayoutParams<TProps, TInitialProps, TParent>
  | MakeClientLayoutParams<TProps, TInitialProps, TParent>;

let keyCount = 0;

export const makeLayout = <
  TProps extends LayoutBaseProps,
  TInitialProps extends Partial<TProps> = object,
  TParent extends Layout<any, any, any> | undefined = undefined
>(
  initialParams: MakeLayoutInitialParams<TInitialProps> | undefined,
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
  (layout as ServerLayout<TProps, TInitialProps, TParent>).getInitialProps = (
    initialParams as MakeServerLayoutInitialParams<TInitialProps>
  )?.getInitialProps;
  (layout as ClientLayout<TProps, TInitialProps, TParent>).useInitialProps = (
    initialParams as MakeClientLayoutInitialParams<TInitialProps>
  )?.useInitialProps;

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
  let loopLayout: any = layout;
  while (!!loopLayout) {
    if (isServerLayout(loopLayout) && loopLayout.getInitialProps) {
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

  let loopLayout: any = layout;
  while (!!loopLayout) {
    promises.push(
      isServerLayout(loopLayout) && loopLayout.getInitialProps
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
  let loopLayout: any = layout;
  while (!!loopLayout) {
    initialProps.push(
      !isServerLayout(loopLayout) && loopLayout.useInitialProps
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
