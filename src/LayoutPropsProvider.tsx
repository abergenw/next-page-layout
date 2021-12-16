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
import { InitialProps, LayoutInitialPropsStack } from './layout';

export interface LayoutPropsContext {
  resolvedLayoutProps: InitialProps<any>[] | undefined;
  resolvedRenderLayoutProps: InitialProps<any>[] | undefined;
  clientSideInitialProps: LayoutInitialPropsStack<any> | undefined;
}

export interface LayoutPropsResolverContext {
  resolveLayoutProps: (layoutProps: InitialProps<any>) => void;
  resolveRenderLayoutProps: (layoutProps: InitialProps<any>) => void;
  resolveClientSideInitialProps: (
    initialProps: LayoutInitialPropsStack<any>
  ) => void;
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
    resolvedLayoutProps: undefined,
    resolveLayoutProps: (layoutProps) => {
      if (!context.resolvedLayoutProps) {
        context.resolvedLayoutProps = [];
      }
      context.resolvedLayoutProps.unshift(layoutProps);
    },
    resolvedRenderLayoutProps: undefined,
    resolveRenderLayoutProps: (layoutProps) => {
      if (!context.resolvedRenderLayoutProps) {
        context.resolvedRenderLayoutProps = [];
      }
      context.resolvedRenderLayoutProps.push(layoutProps);
    },
    clientSideInitialProps: undefined,
    resolveClientSideInitialProps: (initialProps) => {
      context.resolvedRenderLayoutProps?.splice(0);
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
  resolveMemoKey?: string;
}

export function LayoutPropsProvider(props: LayoutPropsProviderProps) {
  const parentContext = useContext(layoutPropsContext);
  const parentResolverContext = useContext(layoutPropsResolverContext);

  const localContext = useMemo<LayoutPropsContext & LayoutPropsResolverContext>(
    () => {
      return createLayoutPropsContext({
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
    [props.resolveMemoKey]
  );

  const [resolvedLocalContext, setResolvedLocalContext] =
    useStateBacked<LayoutPropsContext>(
      () => props.context ?? parentContext ?? localContext,
      (prev) => createLayoutPropsContext(),
      [props.resolveMemoKey]
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

const useStateBacked = <T,>(
  init: () => T,
  update: (prev: T) => T,
  deps: DependencyList
): [T, Dispatch<SetStateAction<T>>] => {
  const [stateValue, setStateValue] = useState<T>(init);
  const value = useRef(stateValue);

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
    },
  ];
};
