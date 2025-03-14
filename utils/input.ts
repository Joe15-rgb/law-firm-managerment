import { UserRole,  Sex, type User, type Group } from '@prisma/client';

type InputType = 'text' | 'email' | 'number' | 'tel' | 'date' | 'password';

type OtherField = 'select' | 'textarea';

type FieldUser = keyof User;

type Label = `Entrez votre ${FieldUser}`;

type UserInputField = {
   type: InputType;
   name: FieldUser | string;
   value: any;
   label: Label | string;
   placeholder: FieldUser | null;
};

type UserOtherField = {
   type: OtherField;
   name: FieldUser;
   label: Label;
   value: UserRole[] | Sex[] | string;
   selectedOption?: UserRole | Sex;
};

export const fieldUsers: Array<UserInputField | UserOtherField> = [
   {
      type: 'text',
      name: 'firstName',
      value: '',
      label: 'Entrez votre firstName',
      placeholder: 'firstName',
   },
   {
      type: 'text',
      name: 'lastName',
      value: '',
      label: 'Entrez votre lastName',
      placeholder: 'lastName',
   },
   {
      type: 'email',
      name: 'email',
      value: '',
      label: 'Entrez votre email',
      placeholder: 'email',
   },
   {
      type: 'tel',
      name: 'phone',
      value: '',
      label: 'Entrez votre phone',
      placeholder: 'phone',
   },
   {
      type: 'select',
      name: 'role',
      label: 'Entrez votre role',
      value: [...Object.values(UserRole)],
      selectedOption: 'LAWYER',
   },
   {
      type: 'select',
      name: 'sex',
      label: 'Entrez votre sex',
      value: [...Object.values(Sex)],
      selectedOption: 'MALE',
   },
   {
    type: 'password',
    name: 'password',
    label: 'Entrez votre password',
    value:'',
    placeholder: 'passwordHash'
   },
    {
    type: 'password',
    name: 'confirm_password',
    label: 'Confirmez votre password',
    value:'',
    placeholder: 'passwordHash'
   }
];
