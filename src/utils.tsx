import { SWRResponse } from 'swr';
import { InitialProps, wrapError } from './layout';

export const wrapSwrInitialProps = <TData,>(
  response: SWRResponse<TData, unknown>
): InitialProps<TData> => {
  return {
    data: response.data,
    loading: !response.data,
    error: response.error ? wrapError(response.error) : undefined,
  };
};
