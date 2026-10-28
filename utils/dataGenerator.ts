import crypto from 'crypto';
import { faker } from '@faker-js/faker';

export type GeneratedUser = {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  leadSource: string;
  salutation: string;
};

export function generateUser(): GeneratedUser {
  const id = crypto.randomBytes(4).toString('hex');

  return {
    firstName: 'Auto',
    lastName: `User${id}`,
    email: `auto.user.${id}@mailinator.com`,
    company: `TestCompany-${id}`,
    leadSource: 'Web',
    salutation: 'Mr.',
  };
}

export function generateUserByFaker(): GeneratedUser {
  const email = faker.internet.email();

  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email,
    company: faker.company.name(),
    leadSource: 'Web',
    salutation: 'Mr.',
  };
}