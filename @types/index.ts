export type ResultData<T> = {
   data: T[];
   meta: {
      total: number;
      page: number;
      totalPages: number;
      limit: number;
   };
};

export type InputType =
   | 'text'
   | 'email'
   | 'number'
   | 'tel'
   | 'date'
   | 'datetime'
   | 'color'
   | 'file'
   | 'hidden'
   | 'datetime-local'
   | 'password';
export type CustomFieldType = 'select' | 'textarea';

export type FieldName<T> = keyof T;

export interface BaseField {
   type: CustomFieldType | InputType,
   name: string;
   label: string;
   value: any;
   placeholder?: string ;
   selectedOption?: any;
   max?: number,
   min?: number,
   required?: boolean,
   accept?: string
   pattern?: string
}

export type Profile = {
  username: string,
  role: string,
  thumbnail: string | null
}

export type TitleCardAdmin = 'Ledgers' | 'Dossiers' | 'Peoples' | 'Personnel' | 'Reports' | 'Rapports'

export type CardData = {
  title: TitleCardAdmin
  icon: string
  description: string | null
  link: '/ledgers' | '/users' | '/reports'
}

export type MenuItems = {
  title: string,
  data: number
}