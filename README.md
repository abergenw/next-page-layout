# Next Page Layout
A type safe, zero dependency layout solution with data fetching capabilities for Next.js.

**Features**
- Persisted layout state when navigating between pages *
- Server-side layout data population (**getInitialProps**)
- Client-side layout data population (**useInitialProps**)
- Unlimited layout hierarchy depth (parent > child layouts)
- A type safe API using Typescript


<sub>* Similar to [layouts](https://nextjs.org/docs/basic-features/layouts) recently added to Nextjs.</sub>

## Getting started

1. Add next-page-layout to your Nextjs project:
```
npm i next-page-layout
```
2. Wrap page rendering in your custom App with `<LayoutPageRenderer>`:
```tsx
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
4. Clone the code and run `npm run example` to see the included example Nextjs app in action.

##  Background ##

Pages in Nextjs don't come with a hierarchy (like e.g. https://reactrouter.com/). If you want to render 2 pages with a shared layout, this layout must be rendered individually by both pages. By default this means that the shared layout will **remount** whenever navigating between the pages (as the top-level page component changes). This has been a recurring topic in the community and was recently addressed by Nextjs when they introduced [layouts](https://nextjs.org/docs/basic-features/layouts).

Nextjs layouts solve the remount issue but it's far from a perfect solution:

- Server-side data fetching (and SSR) is not supported
- While client-side data fetching is possible, there is no built-in mechanism to prevent a waterfall effect when rendering nested layouts with data requirements.

**next-page-layout** was created to solve these issues.

## Basic Usage ##

Layouts are created with `makeLayout()`. Consider this example:

```tsx
interface LayoutProps {
  title: string;
  children: ReactNode;
}

export const Layout = makeLayout({
  component: (props: LayoutProps) => {
    return (
      <div>
        <h1>{props.title}</h1>
        <div>{props.children}</div>
      </div>
    );
  },
  getInitialProps: async (context) => {
    await sleep(300);
    return {
      title: 'I am a title!',
    };
  },
});
```

Here we create (and export) a layout rendering a title using data fetched with [getInitialProps](https://nextjs.org/docs/api-reference/data-fetching/getInitialProps). When server-side rendering, **getInitialProps** will run on the server similarly to how it would if this was a regular Nextjs page.

To render this layout as part of a page, we need to export `makeLayoutPage()` in a regular Nextjs page file:

```tsx
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
    component: (props) => {
      return <>{props.content}</>;
    },
    layout: Layout,
    useLayoutProps: (props) => ({}),
  }
);
```

The page above defines its own **getInitialProps** but we don't have to call getInitialProps on the layout explicitly since the library takes care of this. In **useLayoutProps** we have the option to pass props to our layout (such as an overridden *title*). This is all type safe and all types are being inferred by Typescript 👍


## Nested layouts ##

Nested layouts are supported by passing the parent layout when calling `makeLayoutPage()`:

```tsx
interface ChildLayoutProps {
  subtitle: string;
  children: ReactNode;
}

export const ChildLayout = makeLayout({
  component: (props: ChildLayoutProps) => {
    return (
      <div>
        <h2>{props.subtitle}</h2>
        <div>{props.children}</div>
      </div>
    );
  },
  getInitialProps: async (context) => {
    await sleep(300);
    return {
      subtitle: 'I am a subtitle!',
    };
  },
  parent: Layout,
});
```

Above we create a child layout to our earlier Layout. We'd render a page with this layout just like we rendered the page with the parent Layout. getInitialProps, useLayoutProps and type inference still works out of the box 👍


## Client-side data fetching and useInitialProps ##

Sometimes we might want to do some data fetching on the client. Despite the obvious drawbacks, client-side data fetching has the following benefits:

- Authentication info might only be available on the client, preventing the server from pre-fetching data (e.g. SSO and/or external auth)
- The default UX when navigating between NextJs pages can become "unresponsive" - to give a feeling of instant navigation, it might be better to instantly render a loading indicator in the UI where content is being updated (preserving the layout).

**next-page-layout** supports client-side data fetching with **useInitialProps**. Here's an example of `Layout` and `ChildLayout` used in our previous example but this time with client-side data fetching. In this example we use [SWR](https://swr.vercel.app/) to fetch data, but any solution with a similar API works well (e.g. [Apollo GraphQL and useQuery](https://www.apollographql.com/docs/react/data/queries/)).

```tsx
// Parent layout.

export const Layout = makeLayout({
  component: (props: LayoutProps) => {
    return (
      <div>
        <h1>{props.title}</h1>
        <div>{props.children}</div>
      </div>
    );
  },
  useInitialProps: () => {
    const result = useSWR('parent', async () => {
      await sleep(300);
      return 'I am a title!';
    });

    return {
      data: {
        title: result.data,
      },
      loading: !result.data,
    };
  },
});

// Child layout.

interface ChildLayoutProps {
  subtitle: string;
  children: ReactNode;
}

export const ChildLayout = makeLayout({
  component: (props: ChildLayoutProps) => {
    return (
      <div>
        <h2>{props.subtitle}</h2>
        <div>{props.children}</div>
      </div>
    );
  },
  useInitialProps: () => {
    const result = useSWR('child', async () => {
      await sleep(300);
      return 'I am a subtitle!';
    });

    return {
      data: {
        subtitle: result.data,
      },
      loading: !result.data,
    };
  },
  parent: Layout,
});

// Page.

export default makeLayoutPage(
  {
    useInitialProps: () => {
      const result = useSWR('page', async () => {
        await sleep(300);
        return 'Page';
      });

      return {
        data: {
          content: result.data,
        },
        loading: !result.data,
      };
    },
  },
  {
    component: (props) => {
      return <>{props.content}</>;
    },
    layout: ChildLayout,
    useLayoutProps: (props) => ({}),
  }
);
```

Note that while the example above renderes 3 "levels of components" (Layout, Child and Page), all using client-side data fetching, there's no waterfall effect. All data fetching happens in parallel! Also note that there's nothing stopping you from mixing and matching layouts/pages with both getInitialProps and useInitialProps. 👍 

## Support ##

Feel free to [open an issue](https://github.com/abergenw/next-page-layout/issues) or reach out to [@abergenw](https://github.com/abergenw).
