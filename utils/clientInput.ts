import type { BaseField, CardData, FieldName } from '@bases/index';
import type { Appointment, Client, LegalCase, User } from '@prisma/client';
import { AppointmentStatus, CaseTypes, ClientType, Sex, UrgencyCase, UserRole } from '@prisma/client';



interface ClientInput extends BaseField {
   name: FieldName<Client>;
}
interface LegalCaseInput extends BaseField {
   name: FieldName<LegalCase>;
}
interface AppointmentInput extends BaseField{
   name: FieldName<Omit<Appointment, 'id'>>}

interface UserInput extends BaseField{
  name: FieldName<User> | 'confirm_password'
}

export enum Country {
   RDCONGO = 'RDCONGO',
   CONGO = 'CONGO',
   RCA = 'RCA',
   CAMEROUN = 'CAMEROUN',
   OTHER = 'OTHER',
}

export enum City {
   KINSHASA = 'KINSHASA',
   LUBUMBASHI = 'LUBUMBASHI',
   KISANGANI = 'KISANGANI',
   MATADI = 'MATADI',
   BUKAVU = 'BUKAVU',
   BOMA = 'BOMA',
   KIKWITI = 'KIKWITI',
   OTHER = 'OTHER',
}

export const inputClients: Array<ClientInput> = [
   {
      type: 'text',
      name: 'firstName',
      label: 'Entrez votre nom',
      value: '',
   },
   {
      type: 'text',
      name: 'lastName',
      label: 'Entrez votre prénom',
      value: '',
   },
   {
      type: 'email',
      name: 'email',
      label: 'Entrez votre email',
      value: '',
   },
   {
      type: 'tel',
      name: 'phone',
      label: 'Entrez votre numero de téléphone',
      value: '',
   },
   {
      type: 'date',
      name: 'birthDate',
      label: 'Entrez votre date de naissance',
      value: '',
   },
   {
      type: 'select',
      name: 'sex',
      label: 'Choisiez votre sexe',
      value: [...Object.values(Sex)],
      selectedOption: Sex.FEMALE,
   },
   {
      type: 'select',
      name: 'clientType',
      label: 'Type de client',
      value: [...Object.values(ClientType)],
      selectedOption: ClientType.INDIVIDUAL,
   },
   {
      type: 'select',
      name: 'country',
      label: 'Entrez votre pays',
      value: [...Object.values(Country)],
      selectedOption: Country.RDCONGO,
   },
   {
      type: 'select',
      name: 'city',
      label: 'Entrez votre ville',
      value: [...Object.values(City)],
      selectedOption: City.KINSHASA,
   },
   {
      type: 'textarea',
      name: 'addressLine1',
      label: 'Entrez votre premiere adresse',
      value: '',
   },
   {
      type: 'textarea',
      name: 'addressLine2',
      label: 'Entrez votre deuxième adresse',
      value: '',
   },
];

export const inputLegalCase: Array<LegalCaseInput> = [
   {
      type: 'textarea',
      name: 'title',
      value: '',
      label: "Entrez l'intitule du dossier",
   },
   {
      type:'number',
      name: 'priority',
      value: 1,
      label: 'Attribuez le point de priorité'
   },
   {
    type: 'select',
    name: 'urgency',
    value: [...Object.values(UrgencyCase)],
    selectedOption: UrgencyCase.LOW,
    label: 'Prority'
   },
   {
    type: 'select',
    name: 'caseType',
    value: [...Object.values(CaseTypes)],
    selectedOption: CaseTypes.CIVIL,
    label: 'Entrez le type du dossier'
   },
    {
      type: 'textarea',
      name: 'description',
      value: '',
      label: "Entrez une description",
   },
];

export const cardData: CardData[] = [
   {
      title: 'Dossiers',
      icon: 'rectangle_stack',
      description: 'Gere vos dossiers ici',
      link: '/ledgers',
   },
   {
      title: 'Personnel',
      icon: 'user_group',
      description: 'Gere votre personnel ici',
      link: '/users',
   },
   {
      title: 'Rapports',
      icon: 'chart_bar_square',
      description: 'Gere vos rapports ici ',
      link: '/reports',
   },

];



export const inputUsers: Array<UserInput> = [
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
    name: 'passwordHash',
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


export const inputsAppointment: Array<AppointmentInput> = [
   {
      type: 'textarea',
      name: 'subject',
      label: 'Sujet de nouveau rendez-vous',
      value: ''
   },
   {
      type:'datetime-local',
      name: 'scheduledAt',
      label: 'Renez-vous fixé à:',
      value: ''
   },
   {
      type: 'number',
      name: 'duration',
      label: 'Durée du rendez-vous fixéé à',
      value: 60,
   },
   {
      type: 'select',
      name: 'status',
      label: 'Status du rendez-vous',
      value: [...Object.values(AppointmentStatus)],
      selectedOption: AppointmentStatus.SCHEDULED,
   },
    {
      type: 'textarea',
      name: 'description',
      label: 'Description rendez-vous',
      value: ''
   },
]


// description: string | null;
//     status: $Enums.AppointmentStatus;
//     legalCaseId: string;
//     organizerId: string;
//     scheduledAt: Date;
//     duration: number;
//     subject: string;
