/**
 * # Apollo Cursor Pagination
 *
 * Implementation of Relay's Connection specs for Apollo Server. Allows your Apollo Server to do cursor-based pagination. It can connect to any ORM, but only the connection with Knex.js is implemented currently.
 */
declare module 'apollo-cursor-pagination' {
  type PaginatorFn<TNodesAccessor> = (
    allNodesAccessor: TNodesAccessor,
    args: {
      before?: string | null;
      after?: string | null;
      first?: number | null;
      last?: number | null;
      orderBy?: string | Array<string>;
      orderDirection?: 'asc' | 'desc';
    },
    opts?: opts
  ) => Promise<{
    pageInfo: {
      hasPreviousPage: boolean;
      hasNextPage: boolean;
      startCursor: string;
      endCursor: string;
    };
    totalCount: number;
    edges: Array<any>;
  }>;

  type OperatorFunctions<TNodesAccessor> = {
    removeNodesBeforeAndIncluding: (nodesAccessor: TNodesAccessor, after: string, opts?: Pick<opts, 'orderColumn' | 'ascOrDesc' | 'isAggregateFn' | 'formatColumnFn'>) => TNodesAccessor;
    removeNodesAfterAndIncluding: (nodesAccessor: TNodesAccessor, before: string, opts?: Pick<opts, 'orderColumn' | 'ascOrDesc' | 'isAggregateFn' | 'formatColumnFn'>) => TNodesAccessor;
    getNodesLength: (nodesAccessor: TNodesAccessor, opts?: Pick<OperatorFunctions<TNodesAccessor>, 'getNodesLength'>) => Promise<number>;
    hasLengthGreaterThan?: (nodesAccessor: TNodesAccessor, amount: number) => Promise<boolean>;
    removeNodesFromEnd: (nodesAccessor: TNodesAccessor, amount: number, opts?: Pick<opts, 'orderColumn' | 'ascOrDesc'>) => Promise<TNodesAccessor>;
    removeNodesFromBeginning: (nodesAccessor: TNodesAccessor, amount: number, opts?: Pick<opts, 'orderColumn' | 'ascOrDesc'>) => Promise<TNodesAccessor>;
    convertNodesToEdges?: (
      nodes: Array<any>,
      args: {
        before?: string | null;
        after?: string | null;
        first?: number | null;
        last?: number | null;
      }
    ) => Array<any>;
    orderNodesBy?: (nodesAccessor: TNodesAccessor, opts: Pick<opts, 'orderColumn' | 'ascOrDesc' | 'isAggregateFn' | 'formatColumnFn'>) => TNodesAccessor;
  };

  type opts = {
    isAggregateFn?: (column: any) => boolean;
    /**
     * # Formatting Column Names
     *
     * If you are using something like [Objection](https://vincit.github.io/objection.js/) and have
     * mapped the column names to something like snakeCase instead of camel_case, you'll want to use
     * the `formatColumnFn` option to make sure you're ordering by and building cursors from the correct
     * column name:
     *
     * @example
     * const result = await paginate(
     *   baseQuery,
     *   { first, last, before, after, orderBy, orderDirection },
     *   {
     *     formatColumnFn: (column) => {
     *       // Logic to transform your column name goes here...
     *       return column
     *     }
     *   }
     * );
     * @param name - current column name
     * @return desired name
     */
    formatColumnFn?: (name: string) => string;
    skipTotalCount?: boolean;
    /**
     * # Customizing Edges
     *
     * If you have additional metadata you would like to pass along with each edge, as is allowed by the Relay
     * specification, you may do so using the `modifyEdgeFn` option:
     *
     * @example
     * const result = await paginate(
     *   baseQuery,
     *   { first, last, before, after, orderBy, orderDirection },
     *   {
     *     modifyEdgeFn: (edge) => ({
     *       ...edge,
     *       custom: 'foo',
     *     })
     *   }
     * );
     * @param edge - the built edge
     * @returns the built edge + custom properties
     */
    modifyEdgeFn?: (edge: any) => any;
    /**@deprecated "orderColumn" is being deprecated in favor of "orderBy" */
    orderColumn?: string;
    /**@deprecated "ascOrDesc" is being deprecated in favor of "orderDirection" */
    ascOrDesc?: 'asc' | 'desc';
  };

  /**
   * # Using an existing connector
   *
   * Use the `paginate` function of the connector in your GraphQL resolver.
   *
   * `paginate` receives the following arguments:
   *
   * @param nodesAccessor - An object that can be queried or accessed to obtain a reduced result set.
   *
   * @param args - GraphQL args for your connection. Can have the following fields: `first`, `last`, `before`, `after`.
   *
   * @param orderArgs - If using a connector with stable cursor, you must indicate to `paginate` how are you sorting your query. Must contain `orderColumn` (which attribute you are ordering by) and `ascOrDesc` (which can be `asc` or `desc`). Note: apollo-cursor-pagination does not sort your query, you must do it yourself before calling `paginate`.
   *
   * @example
   * // cats-connection.js
   * import { knexPaginator as paginate } from 'apollo-cursor-pagination';
   * import knex from '../../../db'; // Or instantiate a connection here
   *
   * export default async (_, args) => {
   *   // orderBy must be the column to sort with or an array of columns for ordering by multiple fields
   *   // orderDirection must be 'asc' or 'desc', or an array of those values if ordering by multiples
   *   const {
   *     first, last, before, after, orderBy, orderDirection,
   *   } = args;

   *   const baseQuery = knex('cats');

   *   const result = await paginate(baseQuery, {first, last, before, after, orderBy, orderDirection});
   *   // result will contain:
   *   // edges
   *   // totalCount
   *   // pageInfo { hasPreviousPage, hasNextPage, }
   *   return result;
   * };
   */
  export const knexPaginator: PaginatorFn<import('knex').QueryBuilder>;

  /**
   * # Creating your own connector
   *
   * Only Knex.js is implemented for now. If you want to connect to a different ORM, you must make your own connector.
   *
   * To create your own connector:
   *
   * 1. Import `apolloCursorPaginationBuilder` from `src/builder/index.js`
   *
   * 2. Call `apolloCursorPaginationBuilder` with the specified params. It will generate a `paginate` function that you can export to use in your resolvers.
   *
   * You can base off from `src/orm-connectors/knex/custom-pagination.js`.
   */
  export const apolloConnectionBuilder: <TNodesAccessor>(operatorFns: OperatorFunctions<TNodesAccessor>) => PaginatorFn<TNodesAccessor>;
}