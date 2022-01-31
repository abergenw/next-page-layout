# Next Page Layout

A type safe, zero dependency layout solution with data fetching capabilities for Next.js.

**Features**

- Persisted layout state when navigating between pages \*
- Server-side layout data population with the usual suspects (**getInitialProps**, **getServerSideProps** and **
  getStaticProps**)
- Client-side layout data population (**"useInitialProps"**)
- Nested layouts with independent data requirements running in parallel
- A type safe API using Typescript

<sub>\* Similar to [layouts](https://nextjs.org/docs/basic-features/layouts) recently added to Nextjs.</sub>

## Current status

This library is fairly new and doesn't have a large user base yet but I'm currently running several applications in
production using this lib and it's **working like a charm**. I suggest you give it a try and let me know how it works out -
I am commited to maintaining this lib.

## Background

Pages in Nextjs don't come with a hierarchy (like e.g. https://reactrouter.com/). If you want to render 2 pages with a
shared layout, this layout must be rendered individually by both pages. By default this means that the shared layout
will **remount** whenever navigating between the pages (as the top-level page component changes). This has been a
recurring topic in the community and was recently addressed by Nextjs when they
introduced [layouts](https://nextjs.org/docs/basic-features/layouts).

Nextjs layouts solve the remount issue but it's far from a perfect solution:

- Server-side data fetching (and SSR) is not supported
- There's no convenient way to duplicate server-side logic on multiple pages (`App` does not support data fetching
  methods)
- While client-side data fetching is possible, there is no built-in mechanism to prevent a waterfall effect when
  rendering nested layouts with data requirements.

## Getting started

1. Add next-page-layout to your Nextjs project:

```
npm i next-page-layout
```

2. Wrap page rendering in your custom App with `<LayoutPageRenderer>`:

```tsx
import { LayoutPageRenderer } from 'next-page-layout';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <LayoutPageRenderer
      page={Component}
      initialProps={pageProps}
      errorComponent={ErrorComponent}
      loadingComponent={LoadingComponent}
    />
  );
}
```

3. Define layouts and pages using the exported `makeLayout()` and `makeLayoutPage()` functions.
4. To properly support server-side rendering, instrument page rendering in your custom Document
   with `prepareDocumentContext()`:

```tsx
import { prepareDocumentContext } from 'next-page-layout';

export default class CustomDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    await prepareDocumentContext(ctx);
    return Document.getInitialProps(ctx);
  }
}
```

**NOTE: This will cause a React hydration warning in development** but it _should_ be safe to ignore this.

The reason this happens is that when SSRing, we need to render the page twice for `useParentProps()` described below to
work. The resulting HTML is passed to the client, which sees a mismatch when composing the initial component tree. This
is instantly corrected with `useLayoutEffect()` which is why it should be safe to ignore this warning.

5. Clone the code and run `npm run example` to see the included example Nextjs app in action.

**next-page-layout** was created specifically to solve these issues.

## Basic Usage

Layouts are created with `makeLayout()`. Consider this example:

```tsx
import { makeLayout } from 'next-page-layout';

interface LayoutProps {
  title: string;
  children: ReactNode;
}

export const Layout = makeLayout(
  {
    // You can use any of:
    //
    // getInitialProps
    // getServerSideProps
    // getStaticProps
    //
    // But note that you cannot mix&match layouts
    // with different server-side data fetching methods.
    //
    // See example app.
    getInitialProps: async (context) => {
      await sleep(300);
      return {
        title: 'I am a title!',
      };
    },
  },
  {
    // Must be defined even for top-level layouts to make types work.
    useParentProps: () => ({}),
    component: (props: LayoutProps) => {
      return (
        <div>
          <h1>{props.title}</h1>
          <div>{props.children}</div>
        </div>
      );
    },
  }
);
```

Here we create (and export) a layout rendering a title using data fetched
with [getInitialProps](https://nextjs.org/docs/api-reference/data-fetching/getInitialProps). When server-side
rendering, **getInitialProps** will run on the server similarly to how it would if this was a regular Nextjs page.

To render this layout as part of a page, we need to export `makeLayoutPage()` in a regular Nextjs page file:

```tsx
import { makeLayoutPage } from 'next-page-layout';

export default makeLayoutPage(
  {
    getInitialProps: async (context) => {
      await sleep(300);
      return {
        content: 'I am a page!',
      };
    },
  },
  {
    layout: Layout,
    useLayoutProps: (props) => ({ title: 'Overridden title' }),
    component: (props) => {
      return <>{props.content}</>;
    },
  }
);
```

The page above defines its own **getInitialProps** but we don't have to call getInitialProps on the layout explicitly
since the library takes care of this. In **useLayoutProps** we have the option to pass props to our layout (such as an
overridden _title_). This is all type safe thanks to Typescript and type inference 👍

## Nested layouts

Nested layouts are supported by passing the parent layout when calling `makeLayoutPage()`:

```tsx
import { makeLayout } from 'next-page-layout';

interface ChildLayoutProps {
  subtitle: string;
  children: ReactNode;
}

export const ChildLayout = makeLayout(
  {
    getInitialProps: async (context) => {
      await sleep(300);
      return {
        subtitle: 'I am a subtitle!',
      };
    },
  },
  {
    parent: Layout,
    useParentProps: (props) => ({}),
    component: (props: ChildLayoutProps) => {
      return (
        <div>
          <h2>{props.subtitle}</h2>
          <div>{props.children}</div>
        </div>
      );
    },
  }
);
```

Above we create a child layout to our earlier Layout. We'd create a page with this layout just like we created the page
with the parent Layout. getInitialProps, useLayoutProps and type inference still work out of the box 👍

## Client-side data fetching and useInitialProps

Sometimes we might want to do some data fetching on the client. Despite the obvious drawbacks, client-side data fetching
has the following benefits:

- Authentication info might only be available on the client, preventing the server from pre-fetching data (e.g. SSO
  and/or external auth)
- The default UX when navigating between Nextjs pages can become "unresponsive" - to give a feeling of instant
  navigation, it might be better to instantly render a loading indicator in the UI where content is being updated (
  preserving the layout).

**next-page-layout** supports client-side data fetching with **useInitialProps**. Here's an example of `Layout`
and `ChildLayout` used in our previous example but this time with client-side data fetching. In this example we
use [SWR](https://swr.vercel.app/) to fetch data, but any solution with a similar API works well (
e.g. [Apollo GraphQL and useQuery](https://www.apollographql.com/docs/react/data/queries/)).

```tsx
import {
  makeLayout,
  makeLayoutPage,
  wrapSwrInitialProps,
} from 'next-page-layout';
import useSWR from 'swr';

// Parent layout.

interface LayoutProps {
  title: string;
  children: ReactNode;
}

export const Layout = makeLayout(
  {
    useInitialProps: () => {
      return wrapSwrInitialProps(
        useSWR('parent', async () => {
          await sleep(300);
          return { title: 'I am a title!' };
        })
      );
    },
  },
  {
    useParentProps: (props) => ({}),
    component: (props: LayoutProps) => {
      return (
        <div>
          <h1>{props.title}</h1>
          <div>{props.children}</div>
        </div>
      );
    },
  }
);

// Child layout.

interface ChildLayoutProps {
  subtitle: string;
  children: ReactNode;
}

export const ChildLayout = makeLayout(
  {
    useInitialProps: () => {
      return wrapSwrInitialProps(
        useSWR('child', async () => {
          await sleep(300);
          return { subtitle: 'I am a subtitle!' };
        })
      );
    },
  },
  {
    parent: Layout,
    useParentProps: (props) => ({}),
    component: (props: ChildLayoutProps) => {
      return (
        <div>
          <h2>{props.subtitle}</h2>
          <div>{props.children}</div>
        </div>
      );
    },
  }
);

// Page.

export default makeLayoutPage(
  {
    useInitialProps: () => {
      return wrapSwrInitialProps(
        useSWR('page', async () => {
          await sleep(300);
          return { content: 'Page' };
        })
      );
    },
  },
  {
    layout: ChildLayout,
    useLayoutProps: (props) => ({
      subtitle: 'Overriden subtitle!',
    }),
    component: (props) => {
      return <>{props.content}</>;
    },
  }
);
```

Note that while the example above renders 3 levels of components (Layout, ChildLayout and Page), all using client-side
data fetching, there's no waterfall effect. All data fetching happens in parallel! Also note that there's nothing
stopping you from mixing and matching layouts/pages with both getInitialProps and useInitialProps. 👍

## useParentProps

The signature for useParentProps is slightly awkward.

```typescript
type UseParentProps<
  TProps extends LayoutBaseProps,
  TInitialProps extends Partial<TProps>,
  TParent extends Layout<any, any, any> | undefined
> = (props: {
  initialProps: InitialProps<TInitialProps>;
  layoutProps: InitialProps<LayoutSelfProps<TProps, TInitialProps>>;
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
```

useParentProps gets passed an object with various properties and is expected to return "layout props" for the parent.
The various properties on the object are:

**initialProps**

These are the initial props fetched with either getInitialProps or useInitialProps, wrapped in `InitialProps` which is a
data loader wrapper containing the state of the loaded data.

```typescript
export type InitialProps<TInitialProps> = {
  data: TInitialProps | undefined;
  loading?: boolean;
  error?: Error;
};
```

**layoutProps**

These are the "layout props" passed to the layout by a child layout (or page). These are also wrapped in the same data
loader wrapper.

**requireInitialProps**, **requireLayoutProps** and **requireProps**

If we'd only support server-side data fetching with getInitialProps, the signature would be a lot simpler. In this case
we wouldn't need the data loader wrapper `InitialProps` at all and could simply have useParentProps accept the resolved
initialProps and layoutProps.

However, since we support client-side data fetching, we need to account for the fact that both initialProps and
layoutProps might not be resolved when the layouts are rendered and useParentProps called. If you have a layout which
passes some property to a parent layout, and this property is based on data loaded on the client, you have 2 options:

- You pass a placeholder value if data is still being loaded OR
- You use any of the `require` functions to signal that the loading state of the parent layout is dependent on the child
  layout

Here's an example of the latter, using the page in our previous example, but passing data loaded client-side to the
parent:

```tsx
import { makeLayoutPage, wrapSwrInitialProps } from 'next-page-layout';
import useSWR from 'swr';

export default makeLayoutPage(
  {
    useInitialProps: () => {
      return wrapSwrInitialProps(
        useSWR('page', async () => {
          await sleep(300);
          return { content: 'Page' };
        })
      );
    },
  },
  {
    layout: ChildLayout,
    useLayoutProps: (props) =>
      props.requireInitialProps((initialProps) => ({
        subtitle: `Overridden ${initialProps.content}`,
      })),
    component: (props) => {
      return <>{props.content}</>;
    },
  }
);
```

## Support

Feel free to [open an issue](https://github.com/abergenw/next-page-layout/issues) or reach out
to [@abergenw](https://github.com/abergenw).
