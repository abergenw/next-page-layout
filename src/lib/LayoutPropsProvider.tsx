import React, {
  createContext,
  DependencyList,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { InitialProps, Layout, LayoutInitialPropsStack } from './layout';

export interface LayoutPropsContext {
  resolvedLayoutProps: InitialProps<any>[] | undefined;
  clientSideInitialProps: LayoutInitialPropsStack<any> | undefined;
}

export interface LayoutPropsResolverContext {
  resolveClientSideInitialProps: (
    initialProps: LayoutInitialPropsStack<any>
  ) => void;
  resolveLayoutProps: (layoutProps: InitialProps<any>) => void;
  onResolveComplete: () => void;
}

const layoutPropsContext = createContext<LayoutPropsContext | undefined>(
  undefined
);

const layoutPropsResolverContext = createContext<
  LayoutPropsResolverContext | undefined
>(undefined);

export const useLayoutProps = (): LayoutPropsContext => {
  const context = useContext(layoutPropsContext);
  if (!context) {
    throw Error('No layout props context');
  }
  return context;
};

export const useLayoutPropsResolver = (): LayoutPropsResolverContext => {
  const context = useContext(layoutPropsResolverContext);
  if (!context) {
    throw Error('No layout props resolver context');
  }
  return context;
};

export const createLayoutPropsContext = (
  override?: Partial<LayoutPropsContext & LayoutPropsResolverContext>
): LayoutPropsContext & LayoutPropsResolverContext => {
  const context: LayoutPropsContext & LayoutPropsResolverContext = {
    resolvedLayoutProps: [],
    resolveLayoutProps: (layoutProps) => {
      context.resolvedLayoutProps?.push(layoutProps);
    },
    clientSideInitialProps: undefined,
    resolveClientSideInitialProps: (initialProps) => {
      context.resolvedLayoutProps?.splice(0);
      context.clientSideInitialProps = initialProps;
    },
    onResolveComplete: () => {
      throw new Error('Override me');
    },
    ...override,
  };

  return context;
};

interface LayoutPropsProviderProps {
  children: ReactNode;
  context?: LayoutPropsContext & LayoutPropsResolverContext;
  layout?: Layout<any, any, any>;
}

export function LayoutPropsProvider(props: LayoutPropsProviderProps) {
  const parentContext = useContext(layoutPropsContext);
  const parentResolverContext = useContext(layoutPropsResolverContext);

  const localContext = useMemo<LayoutPropsContext & LayoutPropsResolverContext>(
    () => {
      return createLayoutPropsContext({
        resolvedLayoutProps: [],
        clientSideInitialProps: undefined,
        onResolveComplete: () => {
          setResolvedLocalContext((prev) => ({
            ...prev,
            resolvedLayoutProps: [...(localContext.resolvedLayoutProps ?? [])],
            clientSideInitialProps: [
              ...(localContext.clientSideInitialProps ?? []),
            ],
          }));
        },
      });
    },
    // eslint-disable-next-line
    [props.layout]
  );

  const [resolvedLocalContext, setResolvedLocalContext] =
    useStateBacked<LayoutPropsContext>(
      () => props.context ?? parentContext ?? localContext,
      (prev) => createLayoutPropsContext(),
      [props.layout]
    );

  if (parentContext) {
    return <>{props.children}</>;
  }

  return (
    <layoutPropsResolverContext.Provider
      value={props.context ?? parentResolverContext ?? localContext}
    >
      <layoutPropsContext.Provider
        value={props.context ?? parentContext ?? resolvedLocalContext}
      >
        {props.children}
      </layoutPropsContext.Provider>
    </layoutPropsResolverContext.Provider>
  );
}

export const useMemoInitial = <T,>(
  initial: T,
  factory: () => T,
  deps: DependencyList | undefined
): T => {
  const isInitial = useRef(true);

  const result = useMemo(() => {
    if (isInitial.current) {
      return initial;
    }
    return factory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  isInitial.current = false;

  return result;
};

const useStateBacked = <T,>(
  init: () => T,
  update: (prev: T) => T,
  deps: DependencyList
): [T, Dispatch<SetStateAction<T>>] => {
  const [stateValue, setStateValue] = useState<T>(init);
  const [_ignored, forceUpdate] = useState<any>();
  const value = useRef(stateValue);

  useMemoInitial(
    null,
    () => {
      value.current = update(value.current);
    },
    deps
  );

  return [
    value.current,
    (action: SetStateAction<T>) => {
      let newValue: T;
      if (typeof action === 'function') {
        newValue = (action as any)(value.current);
      } else {
        newValue = action;
      }
      value.current = newValue;
      setStateValue(newValue);
      forceUpdate({});
    },
  ];
};
