export type ResultData<T> = {
   data: T[];
   meta: {
      total: number;
      page: number;
      totalPages: number;
      limit: number;
   };
};