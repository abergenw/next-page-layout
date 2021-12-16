import React from 'react';
import {
  ComponentsEnhancer,
  DocumentContext,
} from 'next/dist/shared/lib/utils';
import {
  createLayoutPropsContext,
  LayoutPropsProvider,
  LayoutPropsContext,
  LayoutPropsResolverContext,
} from './LayoutPropsProvider';

export const prepareDocumentContext = async (ctx: DocumentContext) => {
  const originalRenderPage = ctx.renderPage;

  ctx.renderPage = async (options?: ComponentsEnhancer) => {
    const renderPage = (
      layoutPropsContext: LayoutPropsContext & LayoutPropsResolverContext
    ) => {
      return originalRenderPage({
        enhanceApp: (OriginalApp) => {
          const App =
            (options as any)?.enhanceApp?.(OriginalApp) ?? OriginalApp;
          return function EnhancedApp(props) {
            return (
              <LayoutPropsProvider context={layoutPropsContext}>
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

    const layoutPropsContext = createLayoutPropsContext();
    const pageResult = renderPage(layoutPropsContext);
    if (layoutPropsContext.resolvedRenderLayoutProps) {
      return renderPage({
        ...layoutPropsContext,
        resolvedLayoutProps: layoutPropsContext.resolvedRenderLayoutProps,
      });
    }
    return pageResult;
  };
};
