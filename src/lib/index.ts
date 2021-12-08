export {
  makeLayout,
  isServerLayout,
  layoutHasGetInitialProps,
  fetchGetInitialProps,
  useLayoutInitialProps,
  isLayout,
} from './layout';
export type {
  LayoutBaseProps,
  ServerLayout,
  ClientLayout,
  Layout,
  LayoutParent,
  LayoutProps,
  InitialProps,
  LayoutInitialProps,
  LayoutInitialPropsStack,
} from './layout';

export { makeLayoutPage, isLayoutPage } from './page';
export type { LayoutPage, LayoutPageInitialPropsOf } from './page';

export { LayoutPageRenderer } from './LayoutPageRenderer';

export { LayoutRenderer } from './LayoutRenderer';
export type { ErrorComponentProps } from './LayoutRenderer';
