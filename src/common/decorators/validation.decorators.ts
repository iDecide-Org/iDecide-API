import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsArabicText(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isArabicText',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          // Arabic Unicode range
          const arabicRegex =
            /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\d\p{P}]+$/u;
          return arabicRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must contain Arabic text`;
        },
      },
    });
  };
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;

          // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
          const strongPasswordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
          return strongPasswordRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be strong (8+ chars, uppercase, lowercase, number, special char)`;
        },
      },
    });
  };
}

export function IsValidGPA(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidGPA',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'number') return false;
          return value >= 0 && value <= 4.0;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be between 0 and 4.0`;
        },
      },
    });
  };
}

export function IsEgyptianPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isEgyptianPhoneNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          // Egyptian phone number pattern
          const egyptianPhoneRegex = /^(\+20|0020|20|0)?1[0125][0-9]{8}$/;
          return egyptianPhoneRegex.test(value.replace(/\s|-/g, ''));
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid Egyptian phone number`;
        },
      },
    });
  };
}
