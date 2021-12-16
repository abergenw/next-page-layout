import React from 'react';
import {
  ComponentsEnhancer,
  DocumentContext,
} from 'next/dist/shared/lib/utils';
import {
  createLayoutPropsContext,
  LayoutPropsProvider,
} from './LayoutPropsProvider';

export const prepareDocumentContext = async (ctx: DocumentContext) => {
  const originalRenderPage = ctx.renderPage;
  const layoutPropsContext = createLayoutPropsContext();

  const renderPage = () => {
    return originalRenderPage({
      enhanceApp: (App) => {
        return function EnhancedApp(props) {
          return (
            <LayoutPropsProvider context={layoutPropsContext}>
              <App {...props} />
            </LayoutPropsProvider>
          );
        };
      },
    });
  };

  await renderPage();

  ctx.renderPage = async (options?: ComponentsEnhancer) => {
    return originalRenderPage({
      enhanceApp: (OriginalApp) => {
        const App = (options as any)?.enhanceApp?.(OriginalApp) ?? OriginalApp;
        return function EnhancedApp(props) {
          return (
            <LayoutPropsProvider
              context={{
                ...layoutPropsContext,
                resolvedLayoutProps:
                  layoutPropsContext.resolvedRenderLayoutProps,
              }}
            >
              <App {...props} />
            </LayoutPropsProvider>
          );
        };
      },
      enhanceComponent: !(options as any).enhanceApp
        ? (options as any)
        : undefined,
    });
  };
};
