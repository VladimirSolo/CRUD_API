import { validate as uuidValidate } from 'uuid';

export const isValidUuid = (id: string): boolean => {
  return uuidValidate(id);
};